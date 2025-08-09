import { Button, Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const SignInPrompt = () => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <Heading level="h2" className="txt-xlarge text-light-text-base dark:text-dark-text-base">
          Already have an account?
        </Heading>
        <Text className="txt-medium text-light-text-muted dark:text-dark-text-muted mt-2">
          Sign in for a better experience.
        </Text>
      </div>
      <div>
        <LocalizedClientLink href="/account">
          <Button variant="secondary" className="h-10 !bg-light-bg-base dark:!bg-dark-bg-base !text-light-text-base dark:!text-dark-text-base !border-light-border dark:!border-dark-border hover:!bg-light-bg-hover dark:hover:!bg-dark-bg-hover" data-testid="sign-in-button">
            Sign in
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default SignInPrompt
