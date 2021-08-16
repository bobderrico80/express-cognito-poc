import { json, urlencoded } from 'body-parser';
import express, { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import { config } from './config';
import authRouter from './routers/auth.router';
import homeRouter from './routers/home.router';
import protectedRouter from './routers/protected.router';

const logger = console;

const app = express();

app.use(morgan('dev'));
app.use(json());
app.use(urlencoded({ extended: true }));

app.use('/', homeRouter);
app.use('/auth', authRouter);
app.use('/protected', protectedRouter);

app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(error);
  res.status(500).json({ message: 'Internal Server Error' });
});

app.listen(config.server.port, () => {
  logger.info(`App has started on port ${config.server.port}!`);
});
