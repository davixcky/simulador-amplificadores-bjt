import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setConcurrency(2);
// Chrome del sistema y backend GL compatible con el entorno.
Config.setChromiumOpenGlRenderer("angle");
