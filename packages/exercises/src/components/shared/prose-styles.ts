import { css } from "styled-system/css"

export const proseStyles = css({
  "& h1, & h2, & h3": {
    fontWeight: "semibold",
    mt: "6",
    mb: "3",
    _first: { mt: "0" },
  },
  "& h1": { fontSize: "xl" },
  "& h2": { fontSize: "lg" },
  "& h3": { fontSize: "md" },
  "& p": { mb: "4", lineHeight: "relaxed" },
  "& ul": { pl: "6", mb: "4", listStyleType: "disc" },
  "& ol": { pl: "6", mb: "4", listStyleType: "decimal" },
  "& li": { mb: "2" },
  "& strong": { fontWeight: "semibold" },
  "& code": {
    bg: "bg.subtle",
    px: "1",
    py: "0.5",
    borderRadius: "sm",
    fontSize: "sm",
  },
  "& table": {
    width: "100%",
    mb: "4",
    mt: "2",
    borderCollapse: "collapse",
    fontSize: "sm",
  },
  "& th, & td": {
    px: "2",
    py: "1",
    borderBottom: "1px solid",
    borderColor: "border.default",
    textAlign: "left",
  },
  "& th": { fontWeight: "semibold" },
})
