import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import { Location } from '@angular/common';

import { CourseService } from '../services/course.service';
import {Course} from '../models/course';
import {Student} from '../models/student';
import {Sheet} from '../models/sheet';
import {SheetService} from '../services/sheet.service';
import {StudentService} from '../services/student.service';
import {AnswerService} from '../services/answer.service';
import {TaskService} from '../services/task.service';



import {ExerciseDialogComponent} from '../exercise-dialog/exercise-dialog.component';
import {MatDialog} from '@angular/material';

@Component({
  selector: 'app-course',
  templateUrl: './course.component.html',
  styleUrls: ['./course.component.css']
})
export class CourseComponent implements OnInit {

  course: Course;
  sheets: Sheet[];
  students:Student[] = [];
  loadingSheets: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private sheetService: SheetService,
    private studentService: StudentService,
    private answerService: AnswerService,
    private taskService: TaskService,
    private location: Location,
    public dialog: MatDialog
    ) {}

  ngOnInit() {
    this.getCourse();
    this.getCourseSheets();
  }

  getCourse(): void {
    this.course = new Course('', '', '', 0);
    const id = this.route.snapshot.paramMap.get('id');
    this.courseService.getCourse(id)
    .subscribe(course => this.course = course);
  }

  delete(sheet: Sheet): void {
    const sheetIndex = this.course.sheets.indexOf(sheet);
    this.sheetService.deleteSheet(sheet).subscribe(_ => {
      if (this.sheets.length > 1) {
        this.sheets.splice(sheetIndex, 1);
      } else {
        this.sheets = [];
      }
      this.course.sheets = this.sheets;
      this.courseService.updateCourse(this.course);
    });
  }

  getStudents() {
    this.sheets.forEach(sheet => {
      if(sheet.submissions == null || sheet.submissions.length <= 0) return
        this.sheetService.getSheetSubmissions(sheet._id.toString()).subscribe(subs => {
          subs.forEach(submission => {
            this.studentService.getStudent(submission.student).subscribe(
              student => {
                if(this.students.find(el => student.mat_nr.toString() === el.mat_nr.toString()) == null) {

                  student.status = this.calculateStudentStatus(student)
                  if(student.status == 1){
                    student.statusIcon = "done"
                    student.statusString = "bestanden"
                  }else{
                    student.statusIcon = "clear"
                    student.statusString = "nicht bestanden"
                  }

                  this.students.push(student)
                }
              },
              error => console.error( error ),
              () => {
              }
              )
          })
        })
    })
  }

  getCourseSheets(): void {
    this.loadingSheets = true;
    const id = this.route.snapshot.paramMap.get('id');
    this.sheetService.getSheets(id)
    .subscribe(sheets => {
      this.sheets = sheets;
    }).add( () => {
      this.loadingSheets = false
      this.getStudents()
    });
  }

  deleteSheet(sheet: Sheet): void {
    this.sheets = this.sheets.filter(s => s !== sheet);
    this.sheetService.deleteSheet(sheet);
  }

  update(sheet: Sheet): void {
    this.router.navigateByUrl('/sheet/' + sheet._id + '/edit');
  }

  add(): void {
    this.dialog.open(ExerciseDialogComponent, {
      width: 'auto',
      data: {courseId: this.route.snapshot.paramMap.get('id')}
    });
  }

  goBack(): void {
    this.location.back();
  }

  calculateStudentStatus(student: Student): number {
    let passedSheets = [];
    let numSheetsRequiredToPass = 1;

    this.studentService.getStudentSubmissions(student._id).subscribe(res => {
      res.forEach(sub => {
        let achievedPoints = 0;
        let maxPoints = 0;
        let passPercentage = 0.5;

        this.answerService.getAnswers(sub._id).subscribe(answers => {
          answers.forEach(answer => {
            answer.corrected = true
            if(answer.corrected){
              achievedPoints += answer.achieved_points;

              console.log(answer)

              this.taskService.getTask(answer.task).subscribe(task => {
                maxPoints += task.points;

                console.log("New answer:")
                console.log(maxPoints)
                console.log(achievedPoints)

                if(achievedPoints >= maxPoints * passPercentage){
                  console.log(passedSheets)
                  if(!passedSheets.includes(sub._id)){
                    passedSheets.push(sub._id);
                    if(passedSheets.length >= numSheetsRequiredToPass) return 1;
                  } 
                }
              })
            }
          })
        })
      })
    })

    return 0;
  }
}
