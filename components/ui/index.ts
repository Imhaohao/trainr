// Shared UI primitives (Phase 0 seed). Extend ADDITIVELY — one component per file.
export { cn } from './cn';
export { Button, buttonVariants } from './Button';
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './Card';
export { Input, Label, type InputProps } from './Input';
export { Textarea, type TextareaProps } from './Textarea';
export { Select, type SelectProps } from './Select';
export { Badge, type BadgeProps } from './Badge';
export { Progress, type ProgressProps } from './Progress';
export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  type TabsProps,
} from './Tabs';
export { Spinner, type SpinnerProps } from './Spinner';
export { default as AiAssistat, AiAssistat as AiAssistant } from './ai-assistat';
export type { AiAssistatMessage, AiAssistatProps } from './ai-assistat';
export {
  default as TrainrNavbar,
  TrainrNavbar as NavigationMenuBar,
} from './navigation-menu-4';
export type { NavLinkItem, TrainrNavbarProps } from './navigation-menu-4';
