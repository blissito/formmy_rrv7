import type { ActionFunction } from "react-router";

declare module "./api.ghosty.chat.enhanced" {
  export namespace Route {
    export type ActionArgs = Parameters<ActionFunction>[0];
  }
}