import express from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import 'dotenv/config';

const app = express();
app.use(express.json());

// 1. Define a Schema for validation
const UserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

// 2. A Type-Safe Route
app.post('/users', (req: Request, res: Response) => {
  const result = UserSchema.safeParse(req.body);
  
  if (!result.success) {
    return res.status(400).json({ error: result.error.format() });
  }

  // Business logic would go in a /services file
  res.status(201).json({ message: "User created", data: result.data });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});