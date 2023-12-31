import IError from "../abstract/error"

import { GT } from "@/graphql/index"

const GraphQLApplicationError = GT.Object({
  name: "GraphQLApplicationError",
  interfaces: () => [IError],
  isTypeOf: () => true,
  fields: () => ({
    message: {
      type: GT.NonNull(GT.String),
    },
    path: {
      type: GT.List(GT.String),
    },

    code: {
      type: GT.String,
    },
  }),
})

export default GraphQLApplicationError
