import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { Button } from '@/components/ui/Button';
import { Task } from '@/types/task';
import { CheckCircle, Sparkles as SparklesIcon, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

// 动画变体
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 }
};

const slideInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
};

// 闪烁效果组件
export const Sparkles: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full"
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            x: Math.random() * 100 + '%',
            y: Math.random() * 100 + '%'
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.3,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  );
};

// 渐变文字组件
export const GradientText: React.FC<{
  children: React.ReactNode;
  colors?: string[];
  className?: string;
}> = ({ children, colors = ['#3B82F6', '#8B5CF6', '#06B6D4'], className }) => {
  const gradientStyle = {
    background: `linear-gradient(45deg, ${colors.join(', ')})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  };

  return (
    <span className={className} style={gradientStyle}>
      {children}
    </span>
  );
};

// 数字滚动组件
export const NumberTicker: React.FC<{
  value: number;
  duration?: number;
  className?: string;
}> = ({ value, duration = 1, className }) => {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.span
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ duration, ease: 'easeOut' }}
      >
        {value}
      </motion.span>
    </motion.span>
  );
};

// 闪光按钮组件
export const ShimmerButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  shimmerColor?: string;
  disabled?: boolean;
}> = ({
  children,
  onClick,
  className,
  shimmerColor = 'rgba(255, 255, 255, 0.3)',
  disabled = false
}) => {
  return (
    <motion.button
      className={cn(
        'relative overflow-hidden rounded-lg px-6 py-3 font-medium text-white transition-all duration-300',
        'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
    >
      <motion.div
        className="absolute inset-0 -top-1 -left-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
        style={{ background: `linear-gradient(45deg, transparent, ${shimmerColor}, transparent)` }}
        initial={{ x: '-100%', skewX: -15 }}
        animate={{ x: '200%' }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3,
          ease: 'easeInOut'
        }}
      />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};

// 动画任务卡片
export const AnimatedTaskCard: React.FC<{
  task: Task;
  onComplete?: () => void;
  className?: string;
}> = ({ task, onComplete, className }) => {
  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <GlassContainer className="relative overflow-hidden p-6">
        <Sparkles className="opacity-20" />

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-white font-semibold text-lg mb-2">{task.title}</h3>
              <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                {task.taskType}
              </span>
            </div>
            <div className="text-right">
              <GradientText className="text-2xl font-bold">
                <NumberTicker value={task.points} />
              </GradientText>
              <div className="text-white/70 text-sm">积分</div>
            </div>
          </div>

          <p className="text-white/80 mb-4 line-clamp-2">{task.description}</p>

          {task.status === 'in_progress' && onComplete && (
            <ShimmerButton
              onClick={onComplete}
              className="bg-green-500/20 border border-green-300/30 hover:bg-green-500/30"
              shimmerColor="rgba(34, 197, 94, 0.3)"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              完成任务
            </ShimmerButton>
          )}
        </div>
      </GlassContainer>
    </motion.div>
  );
};

// 动画统计卡片
export const AnimatedStatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: string;
  color?: string;
}> = ({ title, value, icon, trend, color = 'text-blue-400' }) => {
  return (
    <motion.div
      variants={scaleIn}
      initial="initial"
      animate="animate"
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <GlassContainer className="p-6 text-center">
        <div className="flex items-center justify-between mb-4">
          <div className="text-left">
            <p className="text-white/70 text-sm mb-1">{title}</p>
            <GradientText
              className="text-3xl font-bold"
              colors={['#3B82F6', '#8B5CF6', '#06B6D4']}
            >
              <NumberTicker value={value} />
            </GradientText>
            {trend && (
              <motion.p
                className="text-green-400 text-sm mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {trend}
              </motion.p>
            )}
          </div>
          <motion.div
            className={`${color} text-3xl`}
            animate={{
              rotate: [0, 5, -5, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
          >
            {icon}
          </motion.div>
        </div>
      </GlassContainer>
    </motion.div>
  );
};

// 页面过渡动画
export const PageTransition: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
};

// 列表动画容器
export const AnimatedList: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={{
        initial: { opacity: 0 },
        animate: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1
          }
        },
        exit: { opacity: 0 }
      }}
    >
      {children}
    </motion.div>
  );
};

// 成功动画
export const SuccessAnimation: React.FC<{
  show: boolean;
  onComplete?: () => void;
}> = ({ show, onComplete }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onComplete}
        >
          <motion.div
            className="bg-green-500/20 backdrop-blur-md border border-green-300/30 rounded-2xl p-8 text-center"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', duration: 0.6 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            </motion.div>
            <motion.h2
              className="text-2xl font-bold text-white mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              任务完成！
            </motion.h2>
            <motion.p
              className="text-white/70"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              恭喜你完成了这个任务
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
