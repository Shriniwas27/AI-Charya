import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  Play,
  Pause,
  Square,
  BookOpen,
  Timer,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Maximize,
} from "lucide-react";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  selectedAnswer?: number;
}

const dummyQuestions: Question[] = [
  {
    id: 1,
    question: "What is the capital of Maharashtra?",
    options: ["Mumbai", "Pune", "Nagpur", "Nashik"],
    correctAnswer: 0,
  },
  {
    id: 2,
    question: "Which river flows through Mumbai?",
    options: ["Ganges", "Yamuna", "Mithi", "Godavari"],
    correctAnswer: 2,
  },
  {
    id: 3,
    question: "What is 15 + 27?",
    options: ["40", "42", "45", "47"],
    correctAnswer: 1,
  },
  {
    id: 4,
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: 1,
  },
  {
    id: 5,
    question: "What is the largest mammal?",
    options: ["Elephant", "Blue Whale", "Giraffe", "Hippopotamus"],
    correctAnswer: 1,
  },
];

export default function Quiz() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const chapterTitle = searchParams.get("chapter") || "Chapter 1";

  const [quizStarted, setQuizStarted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: number]: number;
  }>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Quiz settings
  const [numQuestions, setNumQuestions] = useState(5);
  const [duration, setDuration] = useState(10); // minutes

  const timerRef = useRef<NodeJS.Timeout>();
  const fullscreenRef = useRef<HTMLDivElement>(null);

  const questions = dummyQuestions.slice(0, numQuestions);

  useEffect(() => {
    if (quizStarted && !isPaused && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleEndQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [quizStarted, isPaused, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartQuiz = async () => {
    setQuizStarted(true);
    setTimeRemaining(duration * 60);

    // Enter fullscreen
    if (fullscreenRef.current && fullscreenRef.current.requestFullscreen) {
      try {
        await fullscreenRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch (error) {
        console.log("Fullscreen not supported");
      }
    }
  };

  const handlePauseQuiz = () => {
    setIsPaused(!isPaused);
  };

  const handleEndQuiz = async () => {
    setQuizCompleted(true);
    setQuizStarted(false);

    // Exit fullscreen
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (error) {
        console.log("Exit fullscreen failed");
      }
    }

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleAnswerSelect = (questionId: number, answerIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleEndQuiz();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((question) => {
      if (selectedAnswers[question.id] === question.correctAnswer) {
        correct++;
      }
    });
    return {
      correct,
      total: questions.length,
      percentage: Math.round((correct / questions.length) * 100),
    };
  };

  const handleBackToMaterial = () => {
    navigate("/class-material");
  };

  // Quiz Results Screen
  if (quizCompleted) {
    const score = calculateScore();
    return (
      <div className="min-h-screen bg-material-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-8">
          <Card className="bg-white shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <CheckCircle className="h-16 w-16 text-material-green mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-material-gray-900 mb-2">
                  Quiz Completed!
                </h1>
                <p className="text-material-gray-600">
                  {chapterTitle} - Test Results
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-material-blue-50 p-6 rounded-xl">
                  <h3 className="text-2xl font-bold text-material-blue">
                    {score.correct}
                  </h3>
                  <p className="text-material-blue-700">Correct Answers</p>
                </div>
                <div className="bg-material-gray-50 p-6 rounded-xl">
                  <h3 className="text-2xl font-bold text-material-gray-700">
                    {score.total}
                  </h3>
                  <p className="text-material-gray-600">Total Questions</p>
                </div>
                <div className="bg-material-green-50 p-6 rounded-xl">
                  <h3 className="text-2xl font-bold text-material-green">
                    {score.percentage}%
                  </h3>
                  <p className="text-material-green-700">Score</p>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Button
                  onClick={handleBackToMaterial}
                  className="bg-material-blue hover:bg-material-blue-600 text-white px-8 py-3 rounded-xl font-semibold"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Study Material
                </Button>
                <Button
                  onClick={() => {
                    setQuizCompleted(false);
                    setCurrentQuestion(0);
                    setSelectedAnswers({});
                  }}
                  variant="outline"
                  className="px-8 py-3 rounded-xl font-semibold"
                >
                  Retake Quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Quiz Interface (Fullscreen)
  if (quizStarted) {
    const question = questions[currentQuestion];
    return (
      <div
        ref={fullscreenRef}
        className="min-h-screen bg-material-gray-900 text-white"
      >
        {/* Quiz Header */}
        <div className="bg-material-gray-800 border-b border-material-gray-700 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">{chapterTitle} - Quiz</h1>
              <div className="bg-material-blue-600 px-3 py-1 rounded-full text-sm">
                Question {currentQuestion + 1} of {questions.length}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-material-gray-700 px-4 py-2 rounded-lg">
                <Timer className="h-4 w-4" />
                <span className="font-mono text-lg">
                  {formatTime(timeRemaining)}
                </span>
              </div>

              <Button
                onClick={handlePauseQuiz}
                variant="outline"
                size="sm"
                className="bg-material-yellow-600 hover:bg-material-yellow-700 text-white border-none"
              >
                {isPaused ? (
                  <Play className="h-4 w-4" />
                ) : (
                  <Pause className="h-4 w-4" />
                )}
                {isPaused ? "Resume" : "Pause"}
              </Button>

              <Button
                onClick={handleEndQuiz}
                variant="destructive"
                size="sm"
                className="bg-red-600 hover:bg-red-700"
              >
                <Square className="h-4 w-4 mr-1" />
                End Test
              </Button>
            </div>
          </div>
        </div>

        {/* Quiz Content */}
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            {isPaused ? (
              <div className="text-center py-20">
                <Pause className="h-16 w-16 mx-auto mb-4 text-material-yellow-500" />
                <h2 className="text-2xl font-bold mb-2">Quiz Paused</h2>
                <p className="text-material-gray-400 mb-6">
                  Click Resume to continue
                </p>
                <Button
                  onClick={handlePauseQuiz}
                  className="bg-material-yellow-600 hover:bg-material-yellow-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Resume Quiz
                </Button>
              </div>
            ) : (
              <Card className="bg-material-gray-800 border-material-gray-700">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-6 text-white">
                    {question.question}
                  </h2>

                  <div className="space-y-4 mb-8">
                    {question.options.map((option, index) => (
                      <Button
                        key={index}
                        onClick={() => handleAnswerSelect(question.id, index)}
                        variant={
                          selectedAnswers[question.id] === index
                            ? "default"
                            : "outline"
                        }
                        className={`w-full text-left p-4 h-auto justify-start ${
                          selectedAnswers[question.id] === index
                            ? "bg-material-blue-600 hover:bg-material-blue-700 text-white"
                            : "bg-material-gray-700 hover:bg-material-gray-600 text-white border-material-gray-600"
                        }`}
                      >
                        <span className="font-semibold mr-3">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        {option}
                      </Button>
                    ))}
                  </div>

                  <div className="flex justify-between">
                    <Button
                      onClick={handlePreviousQuestion}
                      disabled={currentQuestion === 0}
                      variant="outline"
                      className="bg-material-gray-700 hover:bg-material-gray-600 text-white border-material-gray-600"
                    >
                      Previous
                    </Button>

                    <Button
                      onClick={handleNextQuestion}
                      disabled={selectedAnswers[question.id] === undefined}
                      className="bg-material-green-600 hover:bg-material-green-700"
                    >
                      {currentQuestion === questions.length - 1
                        ? "Finish Quiz"
                        : "Next Question"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Quiz Setup Screen
  return (
    <div className="min-h-screen bg-material-gray-50">
      <div className="px-8 lg:px-12 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              onClick={handleBackToMaterial}
              variant="outline"
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Study Material
            </Button>

            <h1 className="text-4xl font-bold text-material-gray-900 mb-2">
              Quiz Setup
            </h1>
            <p className="text-lg text-material-gray-600">
              {chapterTitle} - Configure your test settings
            </p>
          </div>

          {/* Quiz Settings */}
          <Card className="bg-white shadow-lg">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column - Settings */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-material-blue-100 rounded-lg">
                      <BookOpen className="h-6 w-6 text-material-blue" />
                    </div>
                    <h2 className="text-2xl font-bold text-material-gray-900">
                      Test Configuration
                    </h2>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-material-gray-700 mb-2 block">
                      Number of Questions
                    </Label>
                    <Select
                      value={numQuestions.toString()}
                      onValueChange={(value) =>
                        setNumQuestions(parseInt(value))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 Questions</SelectItem>
                        <SelectItem value="5">5 Questions</SelectItem>
                        <SelectItem value="10">10 Questions</SelectItem>
                        <SelectItem value="15">15 Questions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-material-gray-700 mb-2 block">
                      Time Duration (minutes)
                    </Label>
                    <Select
                      value={duration.toString()}
                      onValueChange={(value) => setDuration(parseInt(value))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 Minutes</SelectItem>
                        <SelectItem value="10">10 Minutes</SelectItem>
                        <SelectItem value="15">15 Minutes</SelectItem>
                        <SelectItem value="30">30 Minutes</SelectItem>
                        <SelectItem value="60">60 Minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Right Column - Preview */}
                <div className="bg-material-gray-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-material-gray-900 mb-4">
                    Quiz Preview
                  </h3>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-material-gray-600">Chapter:</span>
                      <span className="font-semibold">{chapterTitle}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-material-gray-600">Questions:</span>
                      <span className="font-semibold">
                        {numQuestions} questions
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-material-gray-600">Duration:</span>
                      <span className="font-semibold">{duration} minutes</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-material-gray-600">Mode:</span>
                      <span className="font-semibold">Fullscreen</span>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-material-blue-50 rounded-lg border border-material-blue-200">
                    <div className="flex items-start gap-2">
                      <Maximize className="h-5 w-5 text-material-blue mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-material-blue-800">
                          Fullscreen Mode
                        </p>
                        <p className="text-xs text-material-blue-600 mt-1">
                          The quiz will open in fullscreen mode with sidebar
                          hidden for focused testing.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Start Button */}
              <div className="mt-8 text-center">
                <Button
                  onClick={handleStartQuiz}
                  className="bg-material-green hover:bg-material-green-600 text-white px-12 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Start Quiz
                </Button>

                <p className="text-sm text-material-gray-500 mt-3">
                  Make sure you have a stable internet connection before
                  starting
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
