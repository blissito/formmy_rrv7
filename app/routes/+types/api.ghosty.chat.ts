import type { ActionFunction } from "react-router";

declare module "./api.ghosty.chat" {
  export namespace Route {
    export type ActionArgs = Parameters<ActionFunction>[0];
  }
}