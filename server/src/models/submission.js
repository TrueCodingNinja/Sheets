import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const submissionSchema = new mongoose.Schema({
    student: {
        type: Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    answers: [{
        type: Schema.Types.ObjectId,
        ref: 'Answer',
        required: true
    }],
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false
    }
});

submissionSchema.post('remove', function(doc) {
    mongoose.model('Answer').find().where('_id').in(doc.answers).exec((err, docs) => {
        if (err) throw err;
        for (let doc of docs) {
            doc.remove();
        }
    });
});

submissionSchema.methods.hasPassed = function(requiredPoints) {
    return new Promise((resolve, reject) => {
        mongoose.model('Answer').find().where('_id').in(this.answers).exec((err, docs) => {
            if (err) reject(err);
            let points = 0;
            for (let doc of docs) {
                points += doc.achieved_points;
            }
            if (points >= requiredPoints) resolve(true);
            else resolve(false);
        });
    });
};

const answerSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    task: {
        type: Schema.Types.ObjectId,
        ref: 'Task',
        required: true
    },
    feedback: {
        type: String,
        required: false
    },
    auto_corrected: {
        type: Boolean,
        required: false
    },
    corrected: {
        type: Boolean,
        required: false
    },
    help: {
        type: Boolean,
        required: false
    },
    achieved_points: {
        type: Number,
        required: false
    }
});

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: false
    },
    mat_nr: {
        type: Number,
        required: true
    },
    grips_id: {
        type: Number,
        required: true
    }
});

export let Submission = mongoose.model('Submission', submissionSchema);
export let Answer = mongoose.model('Answer', answerSchema);
export let Student = mongoose.model('Student', studentSchema);
