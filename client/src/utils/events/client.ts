import z from "zod";

export const moveEvent = z.object({
  type: z.literal("move"),
  data: z.object({
    leftPercentage: z.number().nonnegative(),
    topPercentage: z.number().nonnegative(),
  }),
});

export type MoveEvent = z.infer<typeof moveEvent>;

export const messageEvent = z.object({
  type: z.literal("message"),
  data: z.object({
    message: z.string().optional(),
  }),
});

export type MessageEvent = z.infer<typeof messageEvent>;

export const leaveEvent = z.object({
  type: z.literal("leave"),
});

export type LeaveEvent = z.infer<typeof leaveEvent>;

export type Event = MoveEvent | LeaveEvent | MessageEvent;

export const events = [moveEvent, leaveEvent, messageEvent];
