import { Schema, Document, Types, model } from 'mongoose';

type ICourse = Document & {
  title: string;
  description: string;
  weeks: string;
  tuition: number;
  minimumSkill: string;
  scholarshipAvailable: boolean;
  createdAt: Date;
  bootcamp: Types.ObjectId;
  user: Types.ObjectId;
  getAverageCost: (bootcampId: Types.ObjectId) => void;
};

const CourseSchema = new Schema({
  title: {
    type: String,
    trim: true,
    required: [true, 'Please add a course title'],
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  weeks: {
    type: String,
    required: [true, 'Please add a number of weeks'],
  },
  tuition: {
    type: Number,
    required: [true, 'Please add a tuition cost'],
  },
  minimumSkill: {
    type: String,
    required: [true, 'Please add a minimum skill'],
    enum: ['beginner', 'intermediate', 'advanced'],
  },
  scholarshipAvailable: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  bootcamp: {
    type: Types.ObjectId,
    ref: 'Bootcamp',
    required: true,
  },
  user: {
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

// Static method to get average of course tuitions
// CourseSchema.statics.getAverageCost = async function (
//   bootcampId: Types.ObjectId
// ) {
//   const obj = await this.aggregate([
//     {
//       $match: { bootcamp: bootcampId },
//     },
//     {
//       $group: {
//         _id: '$bootcamp',
//         averageCost: { $avg: '$tuition' },
//       },
//     },
//   ]);

//   console.log(obj);
// };

// // Call getAverageCost after save
// CourseSchema.post<ICourse>('save', function (this: ICourse) {
//   this.getAverageCost(this.bootcamp);
// });

// // Call getAverageCost before remove
// CourseSchema.pre<ICourse>('remove', function (this: ICourse) {
//   this.getAverageCost(this.bootcamp);
// });

export default model<ICourse>('Course', CourseSchema);
