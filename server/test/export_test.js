/* eslint-env mocha */

import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../src/index';

chai.use(chaiHttp);

const obj = {
        "course" :
        {
            "name": "EIMI",
            "faculty": "Universität Regensburg, Lehrstuhl für Medieninformatik",
            "semester": "SoSe 2018",
           "min_req_sheets": 3
        },
        "sheet": 
        {
                "name": "Exercise Sheet",
                "submissiondate": "2016-05-18 10:00:00.000",
                "min_req_points": 10,
                "order": 1,
                "submissions": [],
                "exercises": [
                    {
                        "name": "Übung",
                        "description": "Aufgabenbeschreibung",
                        "tasks": [
                            {
                                "question": "Frage",
                                "points": 10,
                                "order": 1,
                                "choices": [1, 2, 3]
                            },
                            {
                                "question": "Frage",
                                "points": 10,
                                "order": 2,
                                "choices": [1, 2, 3]
                            }
                        ],
                        "order": 1
                    },
                    {
                        "name": "Übung 2",
                        "description": "Aufgabenbeschreibung",
                        "tasks": [
                            {
                                "question": "Frage",
                                "points": 10,
                                "order": 1,
                                "choices": [1, 2, 3]
                            },
                            {
                                "question": "Frage",
                                "points": 10,
                                "order": 2,
                                "choices": [1, 2, 3]
                            }
                        ],
                        "order": 2
                    }
                ]
            }
};

describe('Export Test', () => {
    it('Get PDF', (done) => {
        chai.request(app).get('/export/pdf/2').send().end((err, res) => {
            if (err) throw err;
            chai.expect(res).to.have.status(200);
            done();
        });
    });
});