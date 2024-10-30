"use client";

import { useState } from 'react';
import { Mic, MicOff, Play, Send } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSpeech } from '@/hooks/useSpeech';
import { generateQuestions, generateFeedback } from '@/lib/gemini';

interface Question {
  question: string;
}

interface Answer {
  question: string;
  answer: string;
}

interface FeedbackItem {
  question: string;
  feedback: string;
  idealAnswer: string;
}

interface Feedback {
  overallFeedback: string;
  detailedFeedback: FeedbackItem[];
}

export default function Home() {
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [status, setStatus] = useState<'idle' | 'ready' | 'interviewing' | 'completed'>('idle');
  
  const { isListening, transcript, speaking, startListening, speak } = useSpeech({
    onSpeechEnd: (transcript) => {
      if (currentQuestionIndex >= 0) {
        const newAnswers = [...answers];
        newAnswers[currentQuestionIndex] = {
          question: questions[currentQuestionIndex].question,
          answer: transcript
        };
        setAnswers(newAnswers);
        
        if (currentQuestionIndex < questions.length - 1) {
          setTimeout(() => {
            speak("Thank you. Let's move to the next question.");
            setTimeout(() => {
              setCurrentQuestionIndex(currentQuestionIndex + 1);
              speak(questions[currentQuestionIndex + 1].question);
            }, 2000);
          }, 1000);
        } else {
          setTimeout(() => {
            speak("Thank you for completing the interview. I'll now analyze your responses.");
            handleInterviewComplete();
          }, 1000);
        }
      }
    }
  });

  const startInterview = async () => {
    if (!topic) return;
    
    try {
      const generatedQuestions = await generateQuestions(topic);
      setQuestions(generatedQuestions);
      setStatus('ready');
      speak("Let's begin. Are you ready to start?");
    } catch (error) {
      console.error('Error generating questions:', error);
    }
  };

  const beginQuestioning = () => {
    setStatus('interviewing');
    setCurrentQuestionIndex(0);
    speak(questions[0].question);
  };

  const handleInterviewComplete = async () => {
    setStatus('completed');
    try {
      const feedbackResult = await generateFeedback(topic, answers);
      setFeedback(feedbackResult);
      speak(feedbackResult.overallFeedback);
    } catch (error) {
      console.error('Error generating feedback:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">AI Interview Assistant</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">Practice interviews with voice-enabled AI feedback</p>
        </div>

        {status === 'idle' && (
          <Card className="p-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Choose Your Topic</h2>
              <div className="flex gap-4">
                <Input
                  placeholder="Enter interview topic..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={startInterview} disabled={!topic}>
                  <Send className="w-4 h-4 mr-2" />
                  Start
                </Button>
              </div>
            </div>
          </Card>
        )}

        {status === 'ready' && (
          <Card className="p-6 text-center">
            <Button onClick={beginQuestioning} size="lg">
              <Play className="w-4 h-4 mr-2" />
              Begin Interview
            </Button>
          </Card>
        )}

        {status === 'interviewing' && (
          <Card className="p-6">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Question {currentQuestionIndex + 1} of {questions.length}</h2>
                <p className="text-lg">{questions[currentQuestionIndex]?.question}</p>
              </div>
              
              <div className="flex justify-center">
                <Button
                  onClick={startListening}
                  disabled={isListening || speaking}
                  variant={isListening ? "destructive" : "default"}
                  size="lg"
                >
                  {isListening ? (
                    <><MicOff className="w-4 h-4 mr-2" /> Recording...</>
                  ) : (
                    <><Mic className="w-4 h-4 mr-2" /> Click to Answer</>
                  )}
                </Button>
              </div>
              
              {transcript && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Your Answer:</h3>
                  <p className="text-gray-600 dark:text-gray-300">{transcript}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {status === 'completed' && feedback && (
          <Card className="p-6">
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Overall Feedback</h2>
                  <p className="text-gray-600 dark:text-gray-300">{feedback.overallFeedback}</p>
                </div>
                
                <div>
                  <h2 className="text-xl font-semibold mb-4">Detailed Feedback</h2>
                  {feedback.detailedFeedback.map((item, index) => (
                    <div key={index} className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h3 className="font-medium mb-2">Question {index + 1}:</h3>
                      <p className="mb-2">{item.question}</p>
                      <div className="ml-4">
                        <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-1">Your Answer:</h4>
                        <p className="mb-2">{answers[index]?.answer}</p>
                        <h4 className="font-medium text-green-600 dark:text-green-400 mb-1">Feedback:</h4>
                        <p className="mb-2">{item.feedback}</p>
                        <h4 className="font-medium text-purple-600 dark:text-purple-400 mb-1">Ideal Answer:</h4>
                        <p>{item.idealAnswer}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </Card>
        )}
      </div>
    </div>
  );
}