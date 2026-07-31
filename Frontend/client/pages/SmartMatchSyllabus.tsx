import { useState } from "react";
import { BookOpen, Target, ArrowRight, CheckCircle2, AlertCircle, Copy } from "lucide-react";

// You can change this to your tunnel/server/proxy as needed
const BASE_URL = "https://cf02a2aac7b6.ngrok-free.app";

interface BackendResponse {
  sr: number;
  class1: string;
  class2: string;
}

const classes = [
  { value: "1", label: "Grade 1" },
  { value: "2", label: "Grade 2" },
  { value: "3", label: "Grade 3" },
  { value: "4", label: "Grade 4" },
  { value: "5", label: "Grade 5" },
  { value: "6", label: "Grade 6" },
  { value: "7", label: "Grade 7" },
  { value: "8", label: "Grade 8" },
  { value: "9", label: "Grade 9" },
  { value: "10", label: "Grade 10" },
];

const subjects = ["Marathi", "English", "Math", "Science", "EVS"];

export default function SmartMatchSyllabus() {
  const [selectedClass1, setSelectedClass1] = useState("");
  const [selectedClass2, setSelectedClass2] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [results, setResults] = useState<BackendResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getGradeLabel = (value: string) => {
    const grade = classes.find(cls => cls.value === value);
    return grade ? grade.label : `Grade ${value}`;
  };

  // Extract chapter name from full string
  const extractChapterInfo = (fullText: string) => {
    const match = fullText.match(/Chapter (\d+): (.+)/);
    if (match) {
      return {
        number: match[1],
        title: match[2],
        full: fullText
      };
    }
    return {
      number: "",
      title: fullText,
      full: fullText
    };
  };

  // Check if chapters are similar/same
  const areChaptersSimilar = (class1: string, class2: string) => {
    const chapter1 = extractChapterInfo(class1);
    const chapter2 = extractChapterInfo(class2);
    return chapter1.title.toLowerCase() === chapter2.title.toLowerCase();
  };

  const handleMatchTopics = async () => {
    setErrorMsg(null);
    if (!selectedClass1 || !selectedSubject) {
      alert("Please select primary class and subject");
      return;
    }

    setLoading(true);
    try {
      let apiUrl = `${BASE_URL}/match_chapters/?standard1=${selectedClass1}&standard2=${selectedClass2}&subject=${selectedSubject}`;

      const response = await fetch(apiUrl, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
        }
      });

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        console.log("Backend response:", data);
        setResults(data || []);
      } else {
        const text = await response.text();
        setErrorMsg(
          `API did not return JSON!\nStatus: ${response.status}\nPreview: ${text.slice(0, 180)}\nCheck the endpoint URL and backend server.`
        );
        setResults([]);
      }
    } catch (error: any) {
      if (
        error?.name === "TypeError" &&
        (error.message?.includes("Failed to fetch") || error.message?.includes("NetworkError"))
      ) {
        setErrorMsg(
          `Network or CORS error.\n\nMake sure your backend (${BASE_URL}) allows your browser's origin (CORS).`
        );
      } else {
        setErrorMsg(error?.message || "Unknown error");
      }
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Smart Match Syllabus
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Compare and analyze chapters across different grades with intelligent matching
          </p>
        </div>

        {/* Selection Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            {/* Primary Class */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Primary Class
              </label>
              <select
                value={selectedClass1}
                onChange={e => setSelectedClass1(e.target.value)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-200 bg-white/80"
              >
                <option value="">Select class...</option>
                {classes.map(cls => (
                  <option key={cls.value} value={cls.value}>
                    {cls.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Secondary Class */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Compare with (Optional)
              </label>
              <select
                value={selectedClass2}
                onChange={e => setSelectedClass2(e.target.value)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-200 bg-white/80"
              >
                <option value="">Select class...</option>
                <option value="no-comparison">No comparison</option>
                {classes
                  .filter(cls => cls.value !== selectedClass1)
                  .map(cls => (
                    <option key={cls.value} value={cls.value}>
                      {cls.label}
                    </option>
                  ))}
              </select>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Subject
              </label>
              <select
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-200 bg-white/80"
              >
                <option value="">Select subject...</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <button
              onClick={handleMatchTopics}
              disabled={loading}
              className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Target className="h-5 w-5" />
              {loading ? "Searching..." : "Search"}
            </button>
          </div>

          {/* Selected Info */}
          {(selectedClass1 || selectedClass2 || selectedSubject) && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
              <p className="font-semibold text-gray-800 mb-2">Selection Summary:</p>
              <div className="flex flex-wrap gap-3">
                {selectedClass1 && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    Primary: {getGradeLabel(selectedClass1)}
                  </span>
                )}
                {selectedClass2 && selectedClass2 !== "no-comparison" && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    Secondary: {getGradeLabel(selectedClass2)}
                  </span>
                )}
                {selectedSubject && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Subject: {selectedSubject}
                  </span>
                )}
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="block mb-1">Error occurred:</strong>
                  <pre className="text-sm whitespace-pre-wrap">{errorMsg}</pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    Chapter Comparison Results
                  </h2>
                  <p className="text-gray-600">Side-by-side chapter analysis</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-sm font-semibold">
                  {results.length} chapters found
                </span>
              </div>
            </div>

            {/* Comparison Grid */}
            <div className="space-y-4">
              {results.map((item, index) => {
                const chapter1Info = extractChapterInfo(item.class1);
                const chapter2Info = extractChapterInfo(item.class2);
                const isSimilar = areChaptersSimilar(item.class1, item.class2);

                return (
                  <div
                    key={item.sr}
                    className={`relative rounded-2xl border-2 p-6 transition-all duration-300 hover:shadow-lg ${
                      isSimilar
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                        : 'bg-gradient-to-r from-blue-50 to-purple-50 border-gray-200'
                    }`}
                  >
                    {/* Chapter Number Badge */}
                    <div className="absolute -top-3 left-6">
                      <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold rounded-full shadow-lg">
                        Chapter {item.sr}
                      </span>
                    </div>

                    {/* Similarity Badge */}
                    <div className="absolute -top-3 right-6">
                      {isSimilar ? (
                        <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold rounded-full shadow-lg flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Same Chapter
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-semibold rounded-full shadow-lg flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Different
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                      {/* Class 1 */}
                      <div className="bg-white/80 rounded-xl p-5 border border-blue-200">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-blue-800 text-lg">
                            {getGradeLabel(selectedClass1)}
                          </h4>
                          <button
                            onClick={() => copyToClipboard(item.class1)}
                            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Copy chapter info"
                          >
                            <Copy className="h-4 w-4 text-blue-600" />
                          </button>
                        </div>
                        <div className="space-y-2">
                          {chapter1Info.number && (
                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                              Ch. {chapter1Info.number}
                            </span>
                          )}
                          <h5 className="font-semibold text-gray-900 text-lg leading-tight">
                            {chapter1Info.title}
                          </h5>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {chapter1Info.full}
                          </p>
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="hidden lg:flex items-center justify-center">
                        <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
                          <ArrowRight className="h-6 w-6 text-white" />
                        </div>
                      </div>

                      {/* Class 2 */}
                      <div className="bg-white/80 rounded-xl p-5 border border-purple-200">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-purple-800 text-lg">
                            {selectedClass2 && selectedClass2 !== "no-comparison" 
                              ? getGradeLabel(selectedClass2) 
                              : "Comparison Grade"}
                          </h4>
                          <button
                            onClick={() => copyToClipboard(item.class2)}
                            className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                            title="Copy chapter info"
                          >
                            <Copy className="h-4 w-4 text-purple-600" />
                          </button>
                        </div>
                        <div className="space-y-2">
                          {chapter2Info.number && (
                            <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded">
                              Ch. {chapter2Info.number}
                            </span>
                          )}
                          <h5 className="font-semibold text-gray-900 text-lg leading-tight">
                            {chapter2Info.title}
                          </h5>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {chapter2Info.full}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Stats */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-xl text-center">
                <div className="text-2xl font-bold">
                  {results.filter(item => areChaptersSimilar(item.class1, item.class2)).length}
                </div>
                <div className="text-sm opacity-90">Similar Chapters</div>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 rounded-xl text-center">
                <div className="text-2xl font-bold">{results.length}</div>
                <div className="text-sm opacity-90">Total Chapters</div>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-xl text-center">
                <div className="text-2xl font-bold">
                  {results.filter(item => !areChaptersSimilar(item.class1, item.class2)).length}
                </div>
                <div className="text-sm opacity-90">Different Chapters</div>
              </div>
            </div>
          </div>
        )}

        {/* No Results */}
        {selectedClass1 && selectedSubject && results.length === 0 && !loading && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-12 text-center">
            <div className="p-4 bg-gray-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-3">
              No chapters found
            </h3>
            <p className="text-gray-500 text-lg">
              Try different class or subject combinations to find matching chapters.
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-12 text-center">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0"></div>
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">
              Searching chapters...
            </h3>
            <p className="text-gray-500">
              Please wait while we analyze the syllabus
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
