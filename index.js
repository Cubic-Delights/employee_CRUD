require('dotenv').config();

import express from "express";
import bodyParser from "body-parser";
import mysql, { createConnection, format } from "mysql2";

const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({extended:true}));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'CUBICgamer@05',
    database: 'office'
});

const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60000);
    return localDate.toISOString().split('T')[0];
};

 app.get("/", (req, res) => {
  const success1 = req.query.success1 === 'true';
  const success2 = req.query.success2 === 'true';
  const success3 = req.query.success3 === 'true';

  const query = `
    SELECT e.EmployeeID AS EMPID, e.FirstName AS FName, e.LastName AS LName,
           DATE_FORMAT(e.DOJ, '%d/%m/%Y') AS DOJ, 
           DATE_FORMAT(e.DOB, '%d/%m/%Y') AS DOB,
           d.DeptName AS Dept, l.LocName AS Loc,
           e.EmpMail AS Email, e.EmpPH AS PHNO
    FROM Employee e
    JOIN Department d ON e.DeptID = d.DeptID
    JOIN Location l ON e.LocID = l.LocID
  `;

  db.query(query, (err, result) => {
    if (err) {
      console.log(err);
      return res.send("Error fetching employee data.");
    }
    res.render("index", { employees: result, success1, success2, success3 });
  });
});


app.get("/create" , (req,res)=>{
    res.render("create.ejs");
});

app.post("/submit", (req, res) => {
    const fname = req.body["FName"];
    const lname = req.body["LName"];
    const doj = req.body["DOJ"];
    const dob = req.body["DOB"];
    const dept = req.body["department"];
    const loc = req.body["location"];
    const email = req.body["Email"];
    const phno = req.body["PHNO"];

    const s1 = "SELECT DeptID FROM Department WHERE DeptName = ?";
    db.query(s1, [dept], (err1, result1) => {
        if (err1) {
            console.log(err1);
            return res.send("Error fetching department.");
        }
        if (result1.length === 0) {
            return res.send("No Department found with this name.");
        }

        const DID = result1[0].DeptID;

        const s2 = "SELECT LocID FROM Location WHERE LocName = ?";
        db.query(s2, [loc], (err2, result2) => {
            if (err2) {
                console.log(err2);
                return res.send("Error fetching location.");
            }
            if (result2.length === 0) {
                return res.send("No Location found with this name.");
            }

            const LID = result2[0].LocID;

            const s3 = `INSERT INTO Employee 
                (FirstName, LastName, DOJ, DOB, DeptID, LocID, EmpMail, EmpPH) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

            db.query(s3, [fname, lname, doj, dob, DID, LID, email, phno], (err3, result3) => {
                if (err3) {
                    console.log(err3);
                    return res.send("Error inserting employee.");
                }   
                console.log("Insertion successful.");
                res.redirect("/?success1=true");
            });
        });
    });
});

app.post("/delete" , (req,res)=>{
    const d = `DELETE FROM EMPLOYEE WHERE EmployeeID = ?`;
    db.query(d , [req.body.empId] , (err4 , result4) => {
        if(err4){
            console.log(err4);
            return res.send("Error Deleting Data");
        }
        console.log("Deletion Successfully.");
        res.redirect("/?success2=true");
    });
});

app.post("/edit" , (req,res)=>{
    const id = req.body.empId;
    const e1 = "SELECT * FROM EMPLOYEE WHERE EmployeeID = ?";
    const e2 = "SELECT DeptName FROM DEPARTMENT WHERE DeptID = ?";
    const e3 = "SELECT LocName FROM LOCATION WHERE LocID = ?";
    db.query(e1 , [id] , (err51,result51)=>{
        if(err51 || result51.length === 0){
            console.log(err51);
            return res.send("Employee not found.");
        } 
        const edata = result51[0];
        db.query(e2 , [edata.DeptID] , (err52 , result52)=>{
            if(err52 || result52.length === 0){
            console.log(err52);
            return res.send("Department not found.");
            }
            const dname = result52[0];
            db.query(e3 , [edata.LocID] , (err53, result53)=>{
                if(err53 || result53.length === 0){
                console.log(err53);
                return res.send("Location not found.");
                }
                const lname = result53[0];

                edata.DOJ = formatDate(edata.DOJ);
                edata.DOB = formatDate(edata.DOB);

                res.render("edit.ejs", {edata , dname , lname});
            });
        });
    });
});

app.post("/update", (req, res) => {
    const empId = req.body.EmployeeID;
    const fname = req.body.FName;
    const lname = req.body.LName;
    const doj = req.body.DOJ;
    const dob = req.body.DOB;
    const dept = req.body.department;
    const loc = req.body.location;
    const email = req.body.Email;
    const phno = req.body.PHNO;

    console.log(req.body);

    const getDeptID = "SELECT DeptID FROM Department WHERE DeptName = ?";
    db.query(getDeptID, [dept], (err61, result61) => {
        if (err61 || result61.length === 0) {
            console.log(err61);
            return res.send("Department not found.");
        }
        const deptID = result61[0].DeptID;

        const getLocID = "SELECT LocID FROM Location WHERE LocName = ?";
        db.query(getLocID, [loc], (err62, result62) => {
            if (err62 || result62.length === 0) {
                console.log(err62);
                return res.send("Location not found.");
            }
            const locID = result62[0].LocID;

            const updateQuery = `
                UPDATE Employee 
                SET FirstName = ?, LastName = ?, DOJ = ?, DOB = ?, DeptID = ?, LocID = ?, EmpMail = ?, EmpPH = ?
                WHERE EmployeeID = ?`;

            db.query(updateQuery, [fname, lname, doj, dob, deptID, locID, email, phno, empId], (err63, result63) => {
                if (err63) {
                    console.log(err63);
                    return res.send("Error updating employee.");
                } else if (result63.affectedRows === 0){
                    console.log("No changes were made");
                } else {
                    console.log("Employee updated successfully.");
                    res.redirect("/?success3=true");
                }
            });
        });
    });
});

app.listen(port , ()=>{
    console.log(`Program up and ready on port ${port}`);
});