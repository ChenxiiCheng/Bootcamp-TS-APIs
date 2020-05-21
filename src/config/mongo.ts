import { connect } from 'mongoose';
import configDB from './config';

const connectDB = async () => {
  const conn = await connect(
    `mongodb+srv://${configDB.username}:${configDB.password}@contactkeeper-j0cwi.mongodb.net/ts_apis?retryWrites=true&w=majority`,
    {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    }
  );

  console.log(
    `MongoDB Connected: ${conn.connection.host}`.yellow.underline.bold
  );
};

export default connectDB;
