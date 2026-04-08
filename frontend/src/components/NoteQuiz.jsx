import React, { useState } from 'react';
import axios from 'axios';

function NoteQuiz({ noteId, token }) {
  const [loading, setLoading] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [answers, setAnswers] = useState({}); // Stores user selection: { 0: 2, 1: 0 }
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const generateQuiz = async () => {
    setLoading(true);
    setError('');
    setQuizData(null);
    setAnswers({});
    setSubmitted(false);

    try {
      const res = await axios.post(`http://localhost:8000/api/notes/${noteId}/quiz`, {}, {
        headers: { Authorization: "Bearer " + token }
      });
      setQuizData(res.data);
    } catch (err) {
      setError('生成测验失败，笔记内容可能不足或格式错误。');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (qIndex, oIndex) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qIndex]: oIndex }));
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length < quizData.length) {
      alert('请回答所有问题后再提交！');
      return;
    }
    setSubmitted(true);
  };

  const getScore = () => {
    let score = 0;
    quizData.forEach((q, i) => {
      if (answers[i] === q.answer) score++;
    });
    return score;
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-indigo-100 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-1"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">学习模式</h3>
              <p className="text-sm text-gray-500">基于当前笔记内容生成测验</p>
            </div>
          </div>
          <button 
            onClick={generateQuiz} 
            disabled={loading}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition shadow-sm disabled:bg-indigo-400 cursor-pointer"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                AI 正在选题...
              </>
            ) : "生成测验 🔥"}
          </button>
        </div>

        {error && <div className="text-red-500 text-sm bg-red-50 p-4 rounded-xl border border-red-100">{error}</div>}

        {quizData && (
          <div className="space-y-8 animate-fade-in-up">
            {quizData.map((q, qIndex) => {
              const isCorrect = submitted ? answers[qIndex] === q.answer : null;
              
              return (
                <div key={qIndex} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h4 className="font-bold text-gray-800 mb-4 text-lg">
                    {qIndex + 1}. {q.question}
                  </h4>
                  <div className="space-y-3">
                    {q.options.map((opt, oIndex) => {
                      const isSelected = answers[qIndex] === oIndex;
                      const showAsCorrect = submitted && oIndex === q.answer;
                      const showAsWrong = submitted && isSelected && !showAsCorrect;

                      let btnStyle = "border-gray-200 hover:border-indigo-300 bg-white";
                      if (isSelected) btnStyle = "border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50 text-indigo-700";
                      if (showAsCorrect) btnStyle = "border-green-500 bg-green-50 text-green-700 ring-2 ring-green-200";
                      if (showAsWrong) btnStyle = "border-red-500 bg-red-50 text-red-700 ring-2 ring-red-200";

                      return (
                        <button
                          key={oIndex}
                          onClick={() => handleOptionSelect(qIndex, oIndex)}
                          disabled={submitted}
                          className={`w-full text-left p-4 rounded-xl border transition-all  ${btnStyle} ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                          <div className="flex items-center pointer-events-none">
                            <span className="w-6 h-6 rounded bg-black/5 text-gray-600 flex items-center justify-center font-mono text-sm mr-3 font-bold">
                              {String.fromCharCode(65 + oIndex)}
                            </span>
                            <span className="flex-1 text-sm font-medium">{opt}</span>
                            {/* Icons for score */}
                            {showAsCorrect && <svg className="w-5 h-5 text-green-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            {showAsWrong && <svg className="w-5 h-5 text-red-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Explanation Section */}
                  {submitted && (
                    <div className={`mt-4 p-4 rounded-lg text-sm border ${isCorrect ? 'bg-green-50/50 border-green-100 text-green-800' : 'bg-red-50/50 border-red-100 text-red-800'}`}>
                      <div className="font-bold mb-1 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        解析：
                      </div>
                      <p className="leading-relaxed opacity-90">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Submit Action */}
            <div className="flex items-center justify-between bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
              {!submitted ? (
                <>
                  <p className="text-gray-600 font-medium">请回答完所有问题以查看成绩及解析</p>
                  <button 
                    onClick={handleSubmit}
                    className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition transform hover:-translate-y-0.5"
                  >
                    交卷并查看结果
                  </button>
                </>
              ) : (
                <div className="w-full text-center">
                  <h4 className="text-2xl font-bold mb-2">
                    最终得分：<span className="text-indigo-600">{getScore()} / {quizData.length}</span>
                  </h4>
                  <p className="text-gray-500 text-sm mb-4">
                    {getScore() === quizData.length ? '🎉 太棒了！知识点掌握得非常完美！' : '💡 加油，看完解析再复习一下笔记吧 ~'}
                  </p>
                  <button 
                    onClick={generateQuiz}
                    className="px-5 py-2 text-indigo-600 border border-indigo-200 bg-white font-bold rounded-lg hover:bg-indigo-50 transition"
                  >
                    重新生成一套测验
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NoteQuiz;