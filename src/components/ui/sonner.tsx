import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-center"
      offset="calc(env(safe-area-inset-bottom, 0px) + 5rem)"
      toastOptions={{
        classNames: {
          toast:
            "group toast toast-default rounded-xl text-sm py-2.5 px-3.5 max-w-[92vw] sm:max-w-sm shadow-lg",
          success: "group toast toast-success rounded-xl text-sm py-2.5 px-3.5 max-w-[92vw] sm:max-w-sm shadow-lg",
          error: "group toast toast-error rounded-xl text-sm py-2.5 px-3.5 max-w-[92vw] sm:max-w-sm shadow-lg",
          description: "group-[.toast]:opacity-90 text-xs",
          actionButton:
            "bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium text-xs px-2.5 py-1",
          cancelButton:
            "bg-muted text-muted-foreground hover:bg-muted/80 rounded-lg text-xs px-2.5 py-1",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
