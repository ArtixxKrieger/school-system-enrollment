import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";
import studentsRouter from "./students";
import enrolleesRouter from "./enrollees";
import coursesRouter from "./courses";
import curriculumRouter from "./curriculum";
import rolesRouter from "./roles";
import usersRouter from "./users";
import settingsRouter from "./settings";
import activityLogsRouter from "./activity-logs";
import profileRouter from "./profile";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(dashboardRouter);
router.use(studentsRouter);
router.use(enrolleesRouter);
router.use(coursesRouter);
router.use(curriculumRouter);
router.use(rolesRouter);
router.use(usersRouter);
router.use(settingsRouter);
router.use(activityLogsRouter);
router.use(profileRouter);

export default router;
