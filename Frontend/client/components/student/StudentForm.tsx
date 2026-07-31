import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import axios from 'axios';
import { useDayPicker, useNavigation } from "react-day-picker";

// --- UI & Icon Imports ---
import { Student } from "@/types/student";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
    User, Calendar, Home, Users, HeartPulse, BookOpen,
    ImageIcon, Upload, Camera, X, Check, Loader2
} from "lucide-react";

// --- Webcam & Face Detection Imports ---
import Webcam from "react-webcam";
import { FaceDetection } from "@mediapipe/face_detection";
import { Camera as MediapipeCamera } from "@mediapipe/camera_utils";

// --- Helper: Convert Base64 to File ---
function dataURLtoFile(dataurl: string, filename: string): File | null {
    const arr = dataurl.split(',');
    if (arr.length < 2) return null;
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}

// --- Webcam Modal Component ---
const TARGET_ZONE = { x: 0.2, y: 0.1, width: 0.6, height: 0.8 };
const guideLoaderCss = `
.guide-loader-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10; }
.rect-guide, .rect-progress { fill: transparent; stroke-width: 4; stroke-linecap: round; }
.rect-guide { stroke: rgba(255, 255, 255, 0.4); stroke-dasharray: 6 10; }
.rect-progress { stroke: #34A853; stroke-dasharray: 1536; stroke-dashoffset: 1536; transform-origin: center; transform: rotate(-90deg); }
.guide-loader-container.active .rect-progress { animation: fill-rect 5s linear forwards; }
@keyframes fill-rect { to { stroke-dashoffset: 0; } }
`;

interface WebcamCaptureModalProps {
    onCapture: (imageSrc: string) => void;
    onClose: () => void;
}

const WebcamCaptureModal = ({ onCapture, onClose }: WebcamCaptureModalProps) => {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cameraRef = useRef<MediapipeCamera | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const timerRef = useRef<number | null>(null);
    const hasCapturedRef = useRef(false);
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [message, setMessage] = useState("Position your face in the rectangle");

    useEffect(() => {
        const faceDetection = new FaceDetection({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4/${file}`,
        });
        faceDetection.setOptions({ model: "short", minDetectionConfidence: 0.7 });

        faceDetection.onResults((results) => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d");
            if (!ctx || !canvas || !webcamRef.current?.video) return;

            const video = webcamRef.current.video;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            ctx.save();
            ctx.scale(-1, 1);
            ctx.translate(-canvas.width, 0);
            ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
            ctx.restore();

            let faceFoundInZone = false;
            if (results.detections.length > 0) {
                const detection = results.detections[0];
                const box = detection.boundingBox;
                if (box) {
                    const boxWidth = box.width * canvas.width;
                    const boxHeight = box.height * canvas.height;
                    const boxX = canvas.width - (box.xCenter * canvas.width + boxWidth / 2);
                    const boxY = box.yCenter * canvas.height - boxHeight / 2;
                    ctx.strokeStyle = "#34A853";
                    ctx.lineWidth = 4;
                    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
                    const mirroredXCenter = 1 - box.xCenter;
                    if (mirroredXCenter > TARGET_ZONE.x && mirroredXCenter < TARGET_ZONE.x + TARGET_ZONE.width && box.yCenter > TARGET_ZONE.y && box.yCenter < TARGET_ZONE.y + TARGET_ZONE.height) {
                        faceFoundInZone = true;
                    }
                }
            }

            if (faceFoundInZone && !hasCapturedRef.current) {
                if (!timerRef.current) {
                    setMessage("Hold still...");
                    setIsTimerActive(true);
                    timerRef.current = window.setTimeout(() => {
                        if (video) {
                            const imageSrc = webcamRef.current?.getScreenshot();
                            if (imageSrc) {
                                setCapturedImage(imageSrc);
                                setMessage("✅ Image Captured!");
                            }
                        }
                        hasCapturedRef.current = true;
                        timerRef.current = null;
                        setIsTimerActive(false);
                    }, 5000);
                }
            } else {
                if (timerRef.current) {
                    setMessage("Position your face in the rectangle");
                    setIsTimerActive(false);
                    clearTimeout(timerRef.current);
                    timerRef.current = null;
                }
            }
        });

        if (webcamRef.current && webcamRef.current.video) {
            cameraRef.current = new MediapipeCamera(webcamRef.current.video, {
                onFrame: async () => {
                    if (webcamRef.current?.video && !hasCapturedRef.current) {
                        await faceDetection.send({ image: webcamRef.current.video });
                    }
                },
                width: 640,
                height: 480,
            });
            cameraRef.current.start();
        }

        return () => {
            cameraRef.current?.stop();
            if (timerRef.current) clearTimeout(timerRef.current);
            faceDetection.close();
        };
    }, []);

    const handleCaptureAgain = () => {
        setCapturedImage(null);
        hasCapturedRef.current = false;
        setIsTimerActive(false);
        setMessage("Position your face in the rectangle");
    };

    const handleConfirmCapture = () => {
        if (capturedImage) onCapture(capturedImage);
    };

    const canvasWidth = 640;
    const canvasHeight = 480;
    const rectX = TARGET_ZONE.x * canvasWidth;
    const rectY = TARGET_ZONE.y * canvasHeight;
    const rectWidth = TARGET_ZONE.width * canvasWidth;
    const rectHeight = TARGET_ZONE.height * canvasHeight;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <style>{guideLoaderCss}</style>
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-3xl relative">
                <Button onClick={onClose} variant="ghost" className="absolute top-2 right-2 p-1 h-auto"><X size={24} /></Button>
                <h3 className="text-2xl font-bold text-center mb-4 text-gray-800">Take Profile Photo</h3>
                <div className="relative w-full aspect-video bg-gray-900 rounded-md overflow-hidden mx-auto" style={{ maxWidth: `${canvasWidth}px` }}>
                    {capturedImage ? (<img src={capturedImage} alt="Captured face" className="w-full h-full object-cover" />) : (
                        <>
                            <div className={`guide-loader-container ${isTimerActive ? "active" : ""}`}>
                                <svg width="100%" height="100%" viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}>
                                    <rect className="rect-guide" x={rectX} y={rectY} width={rectWidth} height={rectHeight} rx="20" ry="20" />
                                    <rect className="rect-progress" x={rectX} y={rectY} width={rectWidth} height={rectHeight} rx="20" ry="20" />
                                </svg>
                            </div>
                            <Webcam ref={webcamRef} audio={false} mirrored={true} className="absolute w-full h-full object-cover opacity-0" videoConstraints={{ width: canvasWidth, height: canvasHeight, facingMode: "user" }} />
                            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
                        </>
                    )}
                </div>
                <p className="text-center mt-4 text-lg font-medium text-gray-600 h-6">{message}</p>
                <div className="mt-6 flex justify-center gap-4">
                    {capturedImage ? (
                        <>
                            <Button onClick={handleCaptureAgain} variant="outline" size="lg">Retake Photo</Button>
                            <Button onClick={handleConfirmCapture} size="lg" className="bg-[#34A853] hover:bg-[#1E8E3E] text-white"><Check className="mr-2 h-5 w-5" /> Use this Photo</Button>
                        </>
                    ) : (<Button onClick={onClose} variant="destructive" size="lg">Cancel</Button>)}
                </div>
            </div>
        </div>
    );
};

// --- ✨ Polished Calendar Caption Component ---
type CustomCaptionProps = {
    displayMonth: Date;
    fromYear: number;
    toYear: number;
};

function CustomCaption({ displayMonth, fromYear, toYear }: CustomCaptionProps) {
    const { goToMonth } = useNavigation();

    const years = Array.from({ length: toYear - fromYear + 1 }, (_, i) => fromYear + i);
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const handleYearChange = (year: string) => {
        const newDate = new Date(displayMonth);
        newDate.setFullYear(parseInt(year, 10));
        goToMonth(newDate);
    };

    const handleMonthChange = (monthIndex: string) => {
        goToMonth(new Date(displayMonth.getFullYear(), parseInt(monthIndex, 10)));
    };

    return (
        <div className="flex justify-center items-center gap-2 mb-4">
            <Select value={displayMonth.getMonth().toString()} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-[120px] focus:ring-0">
                    <SelectValue placeholder={months[displayMonth.getMonth()]} />
                </SelectTrigger>
                <SelectContent>
                    {months.map((month, i) => (
                        <SelectItem key={month} value={i.toString()}>{month}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={displayMonth.getFullYear().toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="w-[90px] focus:ring-0">
                    <SelectValue placeholder={displayMonth.getFullYear()} />
                </SelectTrigger>
                <SelectContent>
                    {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

// --- Main Student Form Component ---
const initialFormState = {
    roll_no: '',
    name: '',
    dob: new Date(),
    student_class: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    blood_group: 'A+',
    address: { street: '', city: '', state: '', zip: '' },
    aadhar_number: '',
    preferred_mode: 'Online' as 'Online' | 'Offline',
    preferred_language: 'English',
    mother_tongue: '',
    fatherDetails: { name: '', phone: '', occupation: '' },
    motherDetails: { name: '', phone: '', occupation: '' },
    emergencyContact: { name: '', phone: '', relation: '' },
    healthInfo: { allergies: '', medicalNotes: '' },
    hobbies: '',
    academic_achievements: '',
};

const MandatoryLabel = ({ htmlFor, children }: { htmlFor: string, children: React.ReactNode }) => (<Label htmlFor={htmlFor}>{children} <span className="text-red-500">*</span></Label>);

interface StudentFormProps {
    onSave: (student: Student) => void;
    onCancel: () => void;
}

export function StudentForm({ onSave, onCancel }: StudentFormProps) {
    const [formData, setFormData] = useState(initialFormState);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [isWebcamOpen, setIsWebcamOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // --- Calendar Constants ---
    const currentYear = new Date().getFullYear();
    const fromYear = currentYear - 100;
    const defaultMonth = new Date(currentYear - 18, 0);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNestedInputChange = (section: keyof typeof initialFormState, e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [section]: { ...prev[section as 'address'], [name]: value } }));
    };

    const handleSelectChange = (name: keyof typeof initialFormState, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPhotoFile(file);
            const previewUrl = URL.createObjectURL(file);
            setPhotoPreview(previewUrl);
        }
    }

    const handleWebcamCapture = (imageSrc: string) => {
        const file = dataURLtoFile(imageSrc, `student-photo-${Date.now()}.png`);
        if (file) {
            setPhotoFile(file);
            setPhotoPreview(imageSrc);
        }
        setIsWebcamOpen(false);
    }

    const handleSubmit = async () => {
        const mandatoryFields = {
            "Profile Photo": photoFile,
            "Full Name": formData.name,
            "Roll Number": formData.roll_no,
            "Class & Section": formData.student_class,
        };
        for (const [fieldName, value] of Object.entries(mandatoryFields)) {
            if (!value || (typeof value === 'string' && !value.trim())) {
                alert(`${fieldName} is a required field.`);
                return;
            }
        }

        setIsSaving(true);
        const data = new FormData();

        if (photoFile) {
            data.append('profilePhoto', photoFile);
        }
        data.append('roll_no', formData.roll_no);
        data.append('name', formData.name);
        data.append('student_class', formData.student_class);
        data.append('dob', format(formData.dob, "yyyy-MM-dd"));
        data.append('age', (new Date().getFullYear() - new Date(formData.dob).getFullYear()).toString());
        data.append('gender', formData.gender);
        data.append('blood_group', formData.blood_group);
        data.append('aadhar_number', formData.aadhar_number);
        data.append('preferred_language', formData.preferred_language);
        data.append('mother_tongue', formData.mother_tongue);
        data.append('academic_achievements', formData.academic_achievements);

        const fullAddress = [formData.address.street, formData.address.city, formData.address.state, formData.address.zip].filter(Boolean).join(', ');
        data.append('address', fullAddress);

        data.append('fatherDetails', JSON.stringify(formData.fatherDetails));
        data.append('motherDetails', JSON.stringify(formData.motherDetails));
        data.append('emergency_contact', JSON.stringify(formData.emergencyContact));

        const hobbiesPayload = formData.hobbies.split(',').map(h => h.trim()).filter(Boolean);
        data.append('hobbies', JSON.stringify(hobbiesPayload));

        const healthInfoPayload = {
            allergies: formData.healthInfo.allergies.split(',').map(s => s.trim()).filter(Boolean),
            medicalNotes: formData.healthInfo.medicalNotes.split(',').map(s => s.trim()).filter(Boolean),
        };
        data.append('healthInfo', JSON.stringify(healthInfoPayload));

        try {
            const response = await axios.post('https://cf02a2aac7b6.ngrok-free.app/register_student/', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            alert(response.data.message || "Student registered successfully!");
            onSave(response.data);

        } catch (error) {
            console.error('An error occurred while saving the student:', error);
            let errorMessage = 'An error occurred. Please check the console.';
            if (axios.isAxiosError(error) && error.response) {
                const errorDetail = error.response.data?.detail || 'Unknown error';
                errorMessage = `Failed to save student: ${JSON.stringify(errorDetail)}`;
            }
            alert(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            {isWebcamOpen && (
                <WebcamCaptureModal onCapture={handleWebcamCapture} onClose={() => setIsWebcamOpen(false)} />
            )}
            <div className="min-h-screen bg-gray-50 p-4 md:p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="flex justify-between items-center"><h1 className="text-3xl font-bold text-gray-900">Add New Student</h1><Button variant="outline" onClick={onCancel} disabled={isSaving}>Back to List</Button></div>

                    <Card className="overflow-hidden"><CardHeader className="bg-[#FEF7E0] border-b border-[#FDE293]"><CardTitle className="flex items-center gap-2 text-[#B26A00]"><ImageIcon /> Student Photograph <span className="text-red-500">*</span></CardTitle></CardHeader>
                        <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
                            <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center shadow-inner">
                                {photoPreview ? <img src={photoPreview} alt="Student" className="w-full h-full rounded-full object-cover" /> : <Camera className="w-12 h-12 text-gray-400" />}
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <Button variant="outline" onClick={() => setIsWebcamOpen(true)} disabled={isSaving}>
                                    <Camera className="mr-2 h-4 w-4" />Take Photo
                                </Button>
                                <Button asChild variant="outline" disabled={isSaving}>
                                    <Label htmlFor="photo-upload" className="cursor-pointer">
                                        <Upload className="mr-2 h-4 w-4" /> Upload Photo
                                    </Label>
                                </Button>
                                <Input id="photo-upload" type="file" className="hidden" accept="image/png, image/jpeg" onChange={handlePhotoUpload} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden"><CardHeader className="bg-[#E8F0FE] border-b border-[#D2E3FC]"><CardTitle className="flex items-center gap-2 text-[#1967D2]"><User /> Personal Details</CardTitle></CardHeader>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><MandatoryLabel htmlFor="name">Full Name</MandatoryLabel><Input id="name" name="name" value={formData.name} onChange={handleInputChange} disabled={isSaving} /></div>
                            <div><MandatoryLabel htmlFor="roll_no">Roll Number</MandatoryLabel><Input id="roll_no" name="roll_no" value={formData.roll_no} onChange={handleInputChange} disabled={isSaving} /></div>
                            <div><MandatoryLabel htmlFor="student_class">Class & Section</MandatoryLabel><Input id="student_class" name="student_class" value={formData.student_class} placeholder="e.g., 8th Grade" onChange={handleInputChange} disabled={isSaving} /></div>
                            
                            <div>
                                <MandatoryLabel htmlFor="dob">Date of Birth</MandatoryLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant={"outline"} className="w-full justify-start font-normal" disabled={isSaving}>
                                            <Calendar className="mr-2 h-4 w-4" />{formData.dob ? format(formData.dob, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <CalendarComponent
                                            mode="single"
                                            selected={formData.dob}
                                            onSelect={(date) => date && setFormData(p => ({ ...p, dob: date }))}
                                            fromYear={fromYear}
                                            toYear={currentYear}
                                            defaultMonth={defaultMonth}
                                            disabled={(date) => date > new Date()}
                                            components={{
                                                Caption: (props) => <CustomCaption {...props} fromYear={fromYear} toYear={currentYear} />,
                                            }}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div><MandatoryLabel htmlFor="gender">Gender</MandatoryLabel><Select onValueChange={(v) => handleSelectChange('gender', v as any)} defaultValue={formData.gender} disabled={isSaving}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Male', 'Female', 'Other'].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></div>
                            <div><Label>Blood Group</Label><Select onValueChange={(v) => handleSelectChange('blood_group', v)} defaultValue={formData.blood_group} disabled={isSaving}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}</SelectContent></Select></div>
                            <div><Label htmlFor="mother_tongue">Mother Tongue</Label><Input id="mother_tongue" name="mother_tongue" value={formData.mother_tongue} onChange={handleInputChange} disabled={isSaving} /></div>
                            <div><Label htmlFor="aadhar_number">Aadhaar Number</Label><Input id="aadhar_number" name="aadhar_number" value={formData.aadhar_number} onChange={handleInputChange} disabled={isSaving} /></div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden"><CardHeader className="bg-gray-50 border-b border-gray-200"><CardTitle className="flex items-center gap-2 text-gray-700"><Home /> Address</CardTitle></CardHeader>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2"><Label>Street</Label><Input name="street" value={formData.address.street} onChange={e => handleNestedInputChange('address', e)} disabled={isSaving} /></div>
                            <div><Label>City</Label><Input name="city" value={formData.address.city} onChange={e => handleNestedInputChange('address', e)} disabled={isSaving} /></div>
                            <div><Label>State</Label><Input name="state" value={formData.address.state} onChange={e => handleNestedInputChange('address', e)} disabled={isSaving} /></div>
                            <div><Label>Zip Code</Label><Input name="zip" value={formData.address.zip} onChange={e => handleNestedInputChange('address', e)} disabled={isSaving} /></div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden"><CardHeader className="bg-[#E6F4EA] border-b border-[#CEEAD6]"><CardTitle className="flex items-center gap-2 text-[#188038]"><Users /> Parent / Guardian Details</CardTitle></CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div><h4 className="font-semibold mb-2 text-gray-700">Father's Details</h4><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div><MandatoryLabel htmlFor="father_name">Name</MandatoryLabel><Input id="father_name" name="name" value={formData.fatherDetails.name} onChange={e => handleNestedInputChange('fatherDetails', e)} disabled={isSaving} /></div><div><Label>Phone</Label><Input name="phone" type="tel" value={formData.fatherDetails.phone} onChange={e => handleNestedInputChange('fatherDetails', e)} disabled={isSaving} /></div><div><Label>Occupation</Label><Input name="occupation" value={formData.fatherDetails.occupation} onChange={e => handleNestedInputChange('fatherDetails', e)} disabled={isSaving} /></div></div></div>
                            <div><h4 className="font-semibold mb-2 text-gray-700">Mother's Details</h4><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div><MandatoryLabel htmlFor="mother_name">Name</MandatoryLabel><Input id="mother_name" name="name" value={formData.motherDetails.name} onChange={e => handleNestedInputChange('motherDetails', e)} disabled={isSaving} /></div><div><Label>Phone</Label><Input name="phone" type="tel" value={formData.motherDetails.phone} onChange={e => handleNestedInputChange('motherDetails', e)} disabled={isSaving} /></div><div><Label>Occupation</Label><Input name="occupation" value={formData.motherDetails.occupation} onChange={e => handleNestedInputChange('motherDetails', e)} disabled={isSaving} /></div></div></div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden"><CardHeader className="bg-[#FCE8E6] border-b border-[#FAD2CF]"><CardTitle className="flex items-center gap-2 text-[#C5221F]"><HeartPulse /> Emergency & Health</CardTitle></CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div><h4 className="font-semibold mb-2 text-gray-700">Emergency Contact</h4><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div><MandatoryLabel htmlFor="emergency_name">Name</MandatoryLabel><Input id="emergency_name" name="name" value={formData.emergencyContact.name} onChange={e => handleNestedInputChange('emergencyContact', e)} disabled={isSaving} /></div><div><MandatoryLabel htmlFor="emergency_phone">Phone</MandatoryLabel><Input id="emergency_phone" name="phone" type="tel" value={formData.emergencyContact.phone} onChange={e => handleNestedInputChange('emergencyContact', e)} disabled={isSaving} /></div><div><Label>Relation</Label><Input name="relation" value={formData.emergencyContact.relation} onChange={e => handleNestedInputChange('emergencyContact', e)} disabled={isSaving} /></div></div></div>
                            <div><Label>Allergies (comma-separated)</Label><Input name="allergies" value={formData.healthInfo.allergies} placeholder="e.g., Peanuts, Dust" onChange={e => handleNestedInputChange('healthInfo', e)} disabled={isSaving} /></div>
                            <div><Label>Medical Notes (comma-separated)</Label><Input name="medicalNotes" value={formData.healthInfo.medicalNotes} placeholder="e.g., Requires inhaler for asthma" onChange={e => handleNestedInputChange('healthInfo', e)} disabled={isSaving} /></div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden"><CardHeader className="bg-[#FEF7E0] border-b border-[#FDE293]"><CardTitle className="flex items-center gap-2 text-[#B26A00]"><BookOpen /> Other Details</CardTitle></CardHeader>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><Label>Preferred Language</Label><Select onValueChange={(v) => handleSelectChange('preferred_language', v as any)} defaultValue={formData.preferred_language} disabled={isSaving}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['English', 'Hindi', 'Marathi', 'Other'].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select></div>
                            <div><Label>Preferred Mode</Label><Select onValueChange={(v) => handleSelectChange('preferred_mode', v as any)} defaultValue={formData.preferred_mode} disabled={isSaving}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Online', 'Offline'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
                            <div className="md:col-span-2"><Label htmlFor="hobbies">Hobbies (comma-separated)</Label><Input id="hobbies" name="hobbies" value={formData.hobbies} placeholder="e.g., Reading, Chess, Football" onChange={handleInputChange} disabled={isSaving} /></div>
                            <div className="md:col-span-2"><Label htmlFor="academic_achievements">Academic Achievements</Label><Input id="academic_achievements" name="academic_achievements" value={formData.academic_achievements} placeholder="e.g., Won National Science Olympiad" onChange={handleInputChange} disabled={isSaving} /></div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-4">
                        <Button variant="outline" size="lg" onClick={onCancel} disabled={isSaving}>Cancel</Button>
                        <Button size="lg" onClick={handleSubmit} className="bg-[#4285F4] hover:bg-[#3367D6] text-white" disabled={isSaving}>
                            {isSaving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>) : ("Save Student")}
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}