import { deviceSchema } from "../validators/schemas.js";
import { addDevice, deleteDevice, getDevices } from "../services/deviceService.js";

export async function listDevices(req, res, next) {
  try {
    res.json(await getDevices());
  } catch (error) {
    next(error);
  }
}

export async function createDevice(req, res, next) {
  try {
    const payload = deviceSchema.parse(req.body);
    const device = await addDevice(payload);
    res.status(201).json(device);
  } catch (error) {
    next(error);
  }
}

export async function removeDevice(req, res, next) {
  try {
    const deleted = await deleteDevice(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Device not found" });
    res.json(deleted);
  } catch (error) {
    next(error);
  }
}
