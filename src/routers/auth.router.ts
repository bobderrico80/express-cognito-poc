import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { registerUser, verifyUser, loginUser, refreshUser } from '../services/cognito.service';

const router = Router();

const validateRequest = (req: Request, res: Response, next: () => void) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    res.status(400).json({
      message: 'Bad Request',
      errors: result.array(),
    });
    return;
  }

  next();
};

router.post(
  '/register',
  body('username').notEmpty().isLength({ min: 6 }),
  body('email').notEmpty().normalizeEmail().isEmail(),
  body('password').isString().isLength({ min: 8 }),
  body('birthdate').exists().isISO8601(),
  body('name').notEmpty().isString(),
  body('family_name').notEmpty().isString(),
  validateRequest,
  async (req: Request, res: Response) => {
    const { username, password } = req.body;

    const attributeNames = ['email', 'name', 'family_name', 'birthdate'];

    const userAttributes: any[] = [];
    attributeNames.forEach((attributeName) => {
      userAttributes.push({
        Name: attributeName,
        Value: req.body[attributeName],
      });
    });

    try {
      const response = await registerUser(username, password, userAttributes);
      res.status(200).json(response);
    } catch (error) {
      console.error(error);
      res.status(500).json(error);
    }
  }
);

router.post(
  '/verify',
  body('username').notEmpty().isLength({ min: 6 }),
  body('code').isString().isLength({ min: 6, max: 6 }),
  validateRequest,
  async (req: Request, res: Response) => {
    const { username, code } = req.body;

    try {
      const response = verifyUser(username, code);
      res.status(200).json(response);
    } catch (error) {
      res.status(400).json(error);
    }
  }
);

router.post(
  '/login',
  body('username').notEmpty().isLength({ min: 6 }),
  body('password').isString().isLength({ min: 8 }),
  validateRequest,
  async (req: Request, res: Response) => {
    const { username, password } = req.body;

    try {
      const response = await loginUser(username, password);
      res.status(200).json(response);
    } catch (error) {
      if (error.code === 'NotAuthorizedException') {
        res.status(401).json(error);
        return;
      }

      res.status(500).json(error);
    }
  }
);

router.post(
  '/refresh',
  body('username').notEmpty().isLength({ min: 6 }),
  body('refreshToken').notEmpty(),
  validateRequest,
  async (req: Request, res: Response) => {
    const { username, refreshToken } = req.body;

    try {
      const response = await refreshUser(username, refreshToken);
      res.status(200).json(response);
    } catch (error) {
      if (error.code === 'NotAuthorizedException') {
        res.status(401).json(error);
        return;
      }

      res.status(500).json(error);
    }
  }
);

export default router;
