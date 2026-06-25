import { Button } from '@medusajs/ui';
import { cn } from '../lib/utils';
import { Marquee } from './Marquee';

const SUGGESTED_QUESTIONS = [
  'Show me abandoned carts',
  'What are my top selling products?',
  'How many new customers did I get this month?',
  'Show me total sales over time',
  'Which products have low stock?',
  'What is my average order value?',
  'Show me orders from the last 7 days',
  'Who are my best customers?',
];

export const Suggestions = ({
  onSelect,
  disabled = false,
}: {
  onSelect: (question: string) => void;
  disabled: boolean;
}) => {
  return (
    <Marquee
      items={SUGGESTED_QUESTIONS.map((question, idx) => (
        <Button
          key={idx}
          type="button"
          size="small"
          variant="secondary"
          disabled={disabled}
          onClick={() => onSelect(question)}
          className="shrink-0"
        >
          {question}
        </Button>
      ))}
    />
    // <div className="overflow-hidden">
    //   <div
    //     className={cn('flex gap-2 w-max marquee__track', disabled && 'paused')}
    //   >
    //     {[...SUGGESTED_QUESTIONS, ...SUGGESTED_QUESTIONS].map(
    //       (question, idx) => (
    //         <Button
    //           key={idx}
    //           type="button"
    //           size="small"
    //           variant="secondary"
    //           disabled={disabled}
    //           onClick={() => onSelect(question)}
    //           className="shrink-0"
    //         >
    //           {question}
    //         </Button>
    //       ),
    //     )}
    //   </div>
    // </div>
  );
};
