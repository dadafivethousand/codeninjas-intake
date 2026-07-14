// GET /max — Max's half of the call list.
import { callSheetResponse } from "../lib/calllist.js";

export async function onRequestGet({ env }) {
  return callSheetResponse(env, "max");
}
