import { Resend as ResendConstructor } from "resend";

export const Resend = new ResendConstructor(process.env.RESEND_API_KEY);
