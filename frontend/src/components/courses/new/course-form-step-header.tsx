import { motion } from "framer-motion";

export function CourseFormStepHeader({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="text-center space-y-5">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        key={title}
        transition={{ type: "spring", duration: 0.6 }}
        className="w-24 h-24 mx-auto bg-gradient-primary rounded-full flex items-center justify-center shadow-glow"
      >
        <Icon className="w-12 h-12 text-white" />
      </motion.div>

      <div className="space-y-1 text-center">
        <h2 className="text-xl font-medium">{title}</h2>

        <p className="text-sm text-muted-foreground lg:text-base">
          {description}
        </p>
      </div>
    </div>
  );
}
