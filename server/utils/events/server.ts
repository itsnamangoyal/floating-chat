import z from "zod";

export const moveEvent = z.object({
  type: z.literal("move"),
  data: z.object({
    uid: z.string().uuid(),
    leftPercentage: z.number().nonnegative(),
    topPercentage: z.number().nonnegative(),
  }),
});

export type MoveEvent = z.infer<typeof moveEvent>;

export const messageEvent = z.object({
  type: z.literal("message"),
  data: z.object({
    uid: z.string().uuid(),
    message: z.string().optional(),
  }),
});

export type MessageEvent = z.infer<typeof messageEvent>;

export const leaveEvent = z.object({
  type: z.literal("leave"),
  data: z.object({
    uid: z.string().uuid(),
  }),
});

export type LeaveEvent = z.infer<typeof leaveEvent>;

export const initEvent = z.object({
  type: z.literal("init"),
  data: z.record(
    z.string(),
    z.object({ leftPercentage: z.number(), topPercentage: z.number() })
  ),
});

export type InitEvent = z.infer<typeof initEvent>;

export type Event = MoveEvent | MessageEvent | LeaveEvent | InitEvent;

export const events = [moveEvent, messageEvent, leaveEvent, initEvent];
