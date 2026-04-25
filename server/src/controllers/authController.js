import { loginSchema, registerSchema } from "../validators/authSchemas.js";
import { loginTeacher, registerTeacher } from "../services/authService.js";

export async function register(req, res, next) {
  try {
    const payload = registerSchema.parse(req.body);
    const teacher = await registerTeacher(payload);
    res.status(201).json(teacher);
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await loginTeacher(payload);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
