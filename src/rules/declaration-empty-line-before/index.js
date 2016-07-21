import {
  blockString,
  isCustomProperty,
  isSingleLineString,
  isStandardSyntaxDeclaration,
  isStandardSyntaxProperty,
  optionsHaveException,
  optionsHaveIgnored,
  report,
  ruleMessages,
  validateOptions,
} from "../../utils"

export const ruleName = "declaration-empty-line-before"

export const messages = ruleMessages(ruleName, {
  expected: "Expected empty line before declaration",
  rejected: "Unexpected empty line before declaration",
})

export default function (expectation, options) {
  return (root, result) => {
    const validOptions = validateOptions(result, ruleName, {
      actual: expectation,
      possible: [
        "always",
        "never",
      ],
    }, {
      actual: options,
      possible: {
        except: [
          "first-nested",
          "after-comment",
          "after-declaration",
        ],
        ignore: [
          "inside-single-line-block",
        ],
      },
      optional: true,
    })
    if (!validOptions) { return }

    root.walkDecls(decl => {
      const { prop, parent } = decl

      if (!isStandardSyntaxDeclaration(decl)) { return }
      if (!isStandardSyntaxProperty(prop)) { return }
      if (isCustomProperty(prop)) { return }

      // Optionally ignore nodes inside single-line blocks
      if (
        optionsHaveIgnored(options, "inside-single-line-block")
        && isSingleLineString(blockString(parent))
      ) {
        return
      }

      let expectEmptyLineBefore = (expectation === "always") ? true : false

      // Optionally reverse the expectation for the first nested node
      if (optionsHaveException(options, "first-nested")
        && decl === parent.first) {
        expectEmptyLineBefore = !expectEmptyLineBefore
      }

      // Optionally reverse the expectation if a comment precedes this node
      if (optionsHaveException(options, "after-comment")
        && decl.prev()
        && decl.prev().type === "comment") {
        expectEmptyLineBefore = !expectEmptyLineBefore
      }

      // Optionally reverse the expectation if a declaration precedes this node
      if (optionsHaveException(options, "after-declaration")
        && decl.prev()
        && decl.prev().prop
        && isStandardSyntaxProperty(decl.prev().prop)
        && !isCustomProperty(decl.prev().prop)) {
        expectEmptyLineBefore = !expectEmptyLineBefore
      }

      // Check for at least one empty line
      const before = decl.raws["before"]
      const emptyLineBefore = before.indexOf("\n\n") !== -1
        || before.indexOf("\n\r\n") !== -1

      // Return if the expectation is met
      if (expectEmptyLineBefore === emptyLineBefore) { return }

      const message = expectEmptyLineBefore ? messages.expected : messages.rejected
      report({
        message,
        node: decl,
        result,
        ruleName,
      })
    })
  }
}
