import { Context } from "telegraf";
import { ApiClient } from "./api-client";

export type BotContext = Context;

export type BotDeps = {
  apiClient: ApiClient;
};
