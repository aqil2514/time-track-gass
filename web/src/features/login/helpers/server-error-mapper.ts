import { ErrorServerMapper } from "@/@types/general";
import { LoginSchemaType } from "../schema/login-schema";

export const loginServerErrorMapper: ErrorServerMapper<LoginSchemaType> = {
  404: {
    fields: [
      {
        name: "identifier",
        errorOption: { message: "Account not found" },
      },
    ],
  },
  401: {
    fields: [
      {
        name: "password",
        errorOption: { message: "Invalid Password" },
      },
    ],
  },
  403: {
    formError: "Access Denied",
  },
};
