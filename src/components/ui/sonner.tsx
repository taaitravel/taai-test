import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast toast-default font-medium rounded-xl",
          success: "group toast toast-success font-semibold rounded-xl",
          error: "group toast toast-error font-medium rounded-xl",
          description: "group-[.toast]:opacity-90",
          actionButton: "bg-white/20 text-white border border-white/30 hover:bg-white/30 rounded-lg font-medium",
          cancelButton: "bg-black/20 text-white border border-white/20 hover:bg-black/30 rounded-lg",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
