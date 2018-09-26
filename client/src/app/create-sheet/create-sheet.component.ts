import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ViewEncapsulation } from '@angular/core';

import {Sheet} from '../models/sheet';
import {Exercise} from '../models/exercise';
import {Task} from '../models/task';
import {Solution} from '../models/solution';
import {SolutionRange} from '../models/solutionRange';
import {SheetService} from '../services/sheet.service';
import {ExerciseService} from '../services/exercise.service';
import {TaskService} from '../services/task.service';
import {SolutionService} from '../services/solution.service';

@Component({
  selector: 'app-create-sheet',
  templateUrl: './create-sheet.component.html',
  styleUrls: ['./create-sheet.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class CreateSheetComponent implements OnInit {

  loadingSheet: boolean = false;
  sheet: Sheet;
  selectedExercise: string = null;
  selectedTask: string = null;

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private sheetService: SheetService,
    private exerciseService: ExerciseService,
    private taskService: TaskService,
    private solutionService: SolutionService
  ) { }

  ngOnInit() {
    this.getSheet();
  }

  getSheet(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.loadingSheet = true;
    this.sheetService.getSheet(id).subscribe(
      sheet => this.sheet = sheet,
      error => console.log(error),
      () => {
        this.sheetService.getSheetExercises(this.sheet._id).subscribe(
          exercises => this.sheet.exercises = exercises,
          error => console.error( error ),
          () => {
            this.sheet.exercises.forEach( (exercise, index) => {
                this.taskService.getTasks(exercise._id).subscribe(
                  tasks => this.sheet.exercises[index].tasks = tasks,
                  error => console.error( error ),
                  () => {
                    if (this.sheet.exercises.length - 1 === index) {
                      if (this.selectedExercise == null && this.sheet.exercises.length > 0) {
                        this.selectedExercise = this.sheet.exercises[0]._id;
                      }
                      this.loadingSheet = false
                    }
                  }
                )
            });
          }
        );
      }
    );
  }

  onTaskUpdated(updatedTask: Task): void {
    this.loadingSheet = true;
    this.sheet.exercises.forEach( (exercise, exerciseIndex) => {
      exercise.tasks.forEach((task, taskIndex) => {
        if (task._id === updatedTask._id) {
          this.sheet.exercises[exerciseIndex].tasks[taskIndex] = updatedTask;
          this.loadingSheet = false;
          return;
        }
      })
    })
  }

  onExerciseUpdated(updatedExercise: Exercise): void {
    this.loadingSheet = true;
    this.sheet.exercises.forEach( (exercise, exerciseIndex) => {
      if (exercise._id === updatedExercise._id) {
        this.sheet.exercises[exerciseIndex] = updatedExercise;
        this.taskService.getTasks(exercise._id).subscribe(
          tasks => this.sheet.exercises[exerciseIndex].tasks = tasks,
          error => console.error( error ),
          () => this.loadingSheet = false
        )
      }
    })
  }

  addExercise(): void {
    this.loadingSheet = true;
    let newExercise = new Exercise();
    newExercise.name = 'Neue Aufgabe';
    newExercise.description = 'Beschreibung';
    newExercise.order = this.sheet.exercises.length;
    newExercise.tasks = [];
    newExercise.persistent = false;

    this.exerciseService.addExercise(this.route.snapshot.paramMap.get('id'), newExercise)
      .subscribe(
        exercise =>  this.sheet.exercises.push(exercise[0]),
        error => console.error( error ),
        () => {
          this.selectedExercise = this.sheet.exercises[this.sheet.exercises.length -1]._id;
          this.addTask()
        });
  }

  deleteExercise(exercise: Exercise): void {
    if (window.confirm('Wollen Sie die Aufgabe wirklich löschen?')) {
      this.loadingSheet = true;
      let index = this.sheet.exercises.indexOf(exercise);
      this.sheet.exercises.splice(index, 1);
      this.sheetService.updateSheet(this.sheet).subscribe(
        sheet => console.log(sheet),
        error => {
          console.error( error );
          this.sheet.exercises.splice(index, 0, exercise)
          this.loadingSheet = false;
        },
        () => {
          this.exerciseService.deleteExercise(exercise).subscribe(
            exercise => console.log(exercise),
            error => console.error( error ),
            () => {
              if (this.selectedExercise === exercise._id) {
                this.selectedExercise = null;
              }
              this.loadingSheet = false
            }
          );
        }
      )
    }
  }

  addTask(): void {
    this.loadingSheet = true;
    let index = this.sheet.exercises.findIndex(e => e._id === this.selectedExercise);

    const newTask = new Task();
    newTask.question = 'Neue Unteraufgabe';
    newTask.order = this.sheet.exercises[index].tasks.length;
    newTask.points = 0;

    this.taskService.addTask(this.selectedExercise, newTask)
      .subscribe(task => {
        const newSolution = new Solution();
        newSolution.type = 'none';
        newSolution.range = new SolutionRange(0, 0);
        newSolution.regex = '';
        newSolution.hint = '';
        this.solutionService.addSolution(task[0]._id, newSolution).subscribe(
          solution => {
            task[0].solution = solution[0];
            this.sheet.exercises[index].tasks.push(task[0]);
          },
          error => console.error( error ),
          () => {
            this.selectedExercise = null;
            this.selectedTask = task[0]._id;
            this.loadingSheet = false;
          });
      });
  }

  deleteTask(exercise: Exercise,task: Task) {
    if (exercise.tasks.length === 1) {
      if (window.confirm('Wenn Sie die Teilaufgabe löschen wird automatisch die zugehörige Aufgabe mitgelöscht.' +
        ' Wollen Sie die Teilaufgabe jetzt löschen?')) {
        this.selectedTask = null;
        this.deleteExercise(exercise);
      }
    } else {
      if (window.confirm('Wollen Sie die Teilaufgabe wirklich löschen?')) {
        this.loadingSheet = true;
        let eIndex = this.sheet.exercises.findIndex(e => e._id === exercise._id);
        let tIndex = this.sheet.exercises[eIndex].tasks.findIndex(t => t._id === task._id);
        this.sheet.exercises[eIndex].tasks.splice(tIndex, 1);
        this.exerciseService.updateExercise(exercise).subscribe(
          exercise => console.log(exercise),
          error => {
            console.error( error );
            this.sheet.exercises[eIndex].tasks.splice(tIndex, 0, task);
            this.loadingSheet = false;
          },
          () => {
            this.taskService.deleteTask(task).subscribe(
              task => console.log(task),
              error => console.error( error ),
              () => {
                if (this.selectedTask === task._id) {
                  this.selectedTask = null;
                }
                this.loadingSheet = false
              }
            );
          }
        )
      }
    }
  }

  onSheetUpdate() {
    this.loadingSheet = true;
    this.sheetService.updateSheet(this.sheet).subscribe(
      null,
      error => console.log(error),
      () => this.loadingSheet = false
    );
    console.log('change')
  }

  goBack(): void {
    this.location.back();
  }

}
