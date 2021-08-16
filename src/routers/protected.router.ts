import { Request, Response, Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

router.use(verifyToken);

router.get('/secret', (req: Request, res: Response) => {
  res.json({
    message: `Hi, ${res.locals.username}, this is a protected page, which you are authorized to see`,
  });
});

export default router;
