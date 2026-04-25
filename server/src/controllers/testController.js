import { startTestSchema } from "../validators/schemas.js";
import { endTestSession, getActiveTest, getTestHistory, startTestSession } from "../services/testService.js";
import { getSocketServer } from "../socket/socketStore.js";

export async function startTest(req, res, next) {
  try {
    const payload = startTestSchema.parse(req.body);
    const test = await startTestSession(payload);
    getSocketServer()?.emit("test:started", test);
    res.status(201).json(test);
  } catch (error) {
    next(error);
  }
}

export async function endTest(req, res, next) {
  try {
    const test = await endTestSession(Number(req.params.id));
    if (!test) return res.status(404).json({ message: "Test not found" });
    getSocketServer()?.emit("test:ended", test);
    res.json(test);
  } catch (error) {
    next(error);
  }
}

export async function activeTest(req, res, next) {
  try {
    const test = await getActiveTest();
    res.json(test);
  } catch (error) {
    next(error);
  }
}

export async function testHistory(req, res, next) {
  try {
    const history = await getTestHistory();
    res.json(history);
  } catch (error) {
    next(error);
  }
}
