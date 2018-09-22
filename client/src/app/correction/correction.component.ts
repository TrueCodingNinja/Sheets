import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {SheetService} from "../services/sheet.service";
import {Task} from '../models/task';
import {Submission} from "../models/submission";
import {Exercise} from "../models/exercise";
import {TaskService} from "../services/task.service";

@Component({
  selector: 'app-correction',
  templateUrl: './correction.component.html',
  styleUrls: ['./correction.component.css']
})
export class CorrectionComponent implements OnInit {

  loadingSubmissions: boolean = false;
  loadingExercisesWithTasks: boolean = false;
  exercises: Exercise[];
  tasks: Task[] = [];
  submissions: Submission[];
  selected_submission: string = null;
  selected_task: string = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sheetService: SheetService,
    private taskService: TaskService,
  ) { }

  ngOnInit() {
    this.getExercisesWithTasks();
    this.getSubmissions();
  }

  getExercisesWithTasks() {
    const id = this.route.snapshot.paramMap.get('id');
    this.sheetService.getSheetExercises(id)
      .subscribe(
        exercises => this.exercises = exercises,
        error => console.error( error ),
        () => {
          this.exercises.forEach((exercise, index) => {
            if (exercise.tasks.length > 0) {
              this.taskService.getTasks(exercise._id).subscribe(
                tasks => exercise.tasks = tasks,
                error => console.error(error),
                () => this.exercises[index] = exercise
              );
            }
          })
        });
    /*
          console.log(this.selected_task)
          if (this.selected_task === null) this.selected_task = this.exercises[0].tasks[0]._id;
          console.log(this.selected_task)
          this.loadingExercisesWithTasks = false;
        });
        */
  }

  getSubmissions() {
    this.loadingSubmissions = true;
    const id = this.route.snapshot.paramMap.get('id');
    this.sheetService.getSheetSubmissions(id).subscribe(
      submissions => this.submissions = submissions,
      error => console.error( error ),
      () => {
        if (this.selected_submission === null) this.selected_submission = this.submissions[0]._id;
        this.loadingSubmissions = false;
      });
  }

  navigateSubmissions(change: number): void {
    let currentIndex = this.submissions.findIndex(s => s._id === this.selected_submission);
    let nextIndex = currentIndex + change;
    if (nextIndex < 0) {
      this.selected_submission = this.submissions[this.submissions.length -1]._id;
    }else if (nextIndex > this.submissions.length -1) {
      this.selected_submission = this.submissions[0]._id
    } else {
      this.selected_submission = this.submissions[nextIndex]._id;
    }
  }

  navigateTasks(change: number) {
    let currentExIndex = this.exercises.findIndex(e => e.tasks.findIndex(t => t._id === this.selected_task) >= 0)
    let currentTaIndex = this.exercises[currentExIndex].tasks.findIndex(t => t._id === this.selected_task);
    let newTaIndex = currentTaIndex + change;
    if (newTaIndex < 0) {
      let newExIndex = currentExIndex - 1;
      if (newExIndex < 0) {
        let tasks = this.exercises[this.exercises.length - 1].tasks;
        this.selected_task = this.exercises[this.exercises.length - 1].tasks[tasks.length -1]._id;
      } else {
        this.selected_task = this.exercises[newExIndex].tasks[this.exercises[newExIndex].tasks.length -1]._id;
      }
    } else if (newTaIndex > this.exercises[currentExIndex].tasks.length -1) {
      let newExIndex = currentExIndex + 1;
      if (newExIndex > this.exercises.length - 1) {
        this.selected_task = this.exercises[0].tasks[0]._id;
      } else {
        this.selected_task = this.exercises[newExIndex].tasks[0]._id;
      }
    } else {
      this.selected_task = this.exercises[currentExIndex].tasks[newTaIndex]._id;
    }
  }

  exit (): void {
    this.router.navigate([`/sheets/${this.route.snapshot.paramMap.get('id')}`])
  }


}
