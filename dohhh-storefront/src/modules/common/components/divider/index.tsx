import { clx } from "@medusajs/ui"

const Divider = ({ className }: { className?: string }) => (
  <div
    className={clx("h-px w-full border-b border-light-border dark:border-dark-border mt-1", className)}
  />
)

export default Divider
