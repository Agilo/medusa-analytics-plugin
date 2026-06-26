import { Button } from '@medusajs/ui';
// import { Marquee } from './Marquee';

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
}: {
  onSelect: (question: string) => void;
}) => {
  return (
    <>
    <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>
    <div className="flex gap-4 overflow-x-scroll no-scrollbar" style={{scrollbarWidth:'none',msOverflowStyle:'none'}}>
      {SUGGESTED_QUESTIONS.map((question, idx) => (
        <Button
          key={idx}
          type="button"
          size="small"
          variant="secondary"
          onClick={() => onSelect(question)}
          className="shrink-0"
        >
          {question}
        </Button>
      ))}
    </div>
    </>
  );
};
