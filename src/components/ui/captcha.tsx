import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CaptchaProps {
  onVerify: (isValid: boolean) => void;
  isValid?: boolean;
}

export const Captcha = ({ onVerify, isValid }: CaptchaProps) => {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [operator, setOperator] = useState("+");

  const generateCaptcha = () => {
    const operators = ["+", "-", "×"];
    const selectedOperator = operators[Math.floor(Math.random() * operators.length)];
    
    let n1, n2;
    if (selectedOperator === "-") {
      n1 = Math.floor(Math.random() * 20) + 10; // 10-29
      n2 = Math.floor(Math.random() * 10) + 1; // 1-10
    } else {
      n1 = Math.floor(Math.random() * 10) + 1; // 1-10
      n2 = Math.floor(Math.random() * 10) + 1; // 1-10
    }
    
    setNum1(n1);
    setNum2(n2);
    setOperator(selectedOperator);
    setUserAnswer("");
    onVerify(false);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const getCorrectAnswer = () => {
    switch (operator) {
      case "+":
        return num1 + num2;
      case "-":
        return num1 - num2;
      case "×":
        return num1 * num2;
      default:
        return 0;
    }
  };

  const handleAnswerChange = (value: string) => {
    setUserAnswer(value);
    const correctAnswer = getCorrectAnswer();
    const userNum = parseInt(value);
    onVerify(!isNaN(userNum) && userNum === correctAnswer);
  };

  return (
    <div className="space-y-2">
      <Label className="text-white">Security Check</Label>
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2 bg-white/10 border border-white/30 rounded-md px-3 py-2 text-white font-mono text-lg">
          <span>{num1}</span>
          <span>{operator}</span>
          <span>{num2}</span>
          <span>=</span>
          <span>?</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={generateCaptcha}
          className="bg-white/10 border-white/30 text-white hover:bg-white/20"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <Input
        type="number"
        placeholder="Enter your answer"
        value={userAnswer}
        onChange={(e) => handleAnswerChange(e.target.value)}
        className={`bg-[#1f1f27] border-white/30 text-white placeholder:text-white/50 focus:border-white ${
          isValid === true ? 'border-green-500' : isValid === false && userAnswer ? 'border-red-500' : ''
        }`}
      />
      {isValid === false && userAnswer && (
        <p className="text-red-400 text-sm">Incorrect answer. Please try again.</p>
      )}
      {isValid === true && (
        <p className="text-green-400 text-sm">✓ Verification successful</p>
      )}
    </div>
  );
};