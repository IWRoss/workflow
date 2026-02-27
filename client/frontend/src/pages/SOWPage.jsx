import { useParams } from "react-router-dom";
import { useState, useEffect, use } from "react";
import { firebaseService } from "../services/firebaseService";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function SOWPage() {
    const [loading, setLoading] = useState(true);
    const [sowDetails, setSowDetails] = useState(null);

    const SOWId = useParams().id;

    console.log("SOW ID from URL:", SOWId);
    useEffect(() => {
        const fetchSOWDetails = async () => {
            try {
                // Fetch SOW details using the SOW ID
                const sowDetails = await firebaseService.getSOW(SOWId);
                setSowDetails(sowDetails);

               // console.log("Fetched SOW Details:", sowDetails);
            } catch (error) {
                console.error("Error fetching SOW details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSOWDetails();
    }, [SOWId]);

    const accessSOWDocument = () => {
        if (sowDetails && sowDetails.docId) {
            const docUrl = `https://docs.google.com/document/d/${sowDetails.docId}`;
            window.open(docUrl, "_blank");
        } else {
            alert("Document ID not available for this SOW.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-gray-500 text-lg">
                    Loading SOW details...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="mx-auto bg-white p-6 rounded shadow-md">
                <div className="flex justify-between items-center mb-6">
                    {/* Button to go back*/}
                    <button
                        onClick={() => window.history.back()}
                        className=" bg-yellow-800 text-white px-4 py-2 rounded hover:bg-yellow-900"
                    >
                        Go Back
                    </button>
                    <h1 className="text-3xl font-bold  text-center">SOW Details</h1>
                     <button
                    onClick={accessSOWDocument}
                    className="mt-4 bg-yellow-800 text-white px-4 py-2 rounded hover:bg-yellow-900"
                >
                    View SOW Document
                </button>
                </div>
                {/* Display SOW details in card with formatted fields */}
                <div className="bg-gray-50 p-4 rounded shadow flex flex-col gap-2">
                    {sowDetails ? (
                        <>
                            <div className="flex">
                                <span className="font-semibold mr-2">Client:</span>
                                <span>{sowDetails.client}</span>
                            </div>
                            <div className="flex">
                                <span className="font-semibold mr-2">Client Email:</span>
                                <span>{sowDetails.clientEmail}</span>
                            </div>
                            <div className="flex">
                                <span className="font-semibold mr-2">Project Name:</span>
                                <span>{sowDetails.projectName}</span>
                            </div>
                            <div className="flex">
                                <span className="font-semibold mr-2">Project Owner:</span>
                                <span>{sowDetails.projectOwner}</span>
                            </div>
                            <div className="flex">
                                <span className="font-semibold mr-2">Status:</span>
                                <span>{sowDetails.status}</span>
                            </div>
                            <div className="flex">
                                <span className="font-semibold mr-2">Team Members:</span>
                                <span>{sowDetails.teamMembers}</span>
                            </div>
                            <div className="flex">
                                <span className="font-semibold mr-2">Timeline:</span>
                                <span>
                                    {sowDetails.timeline && sowDetails.timeline.startDate
                                        ? `${sowDetails.timeline.startDate} to ${sowDetails.timeline.endDate}`
                                        : "N/A"}
                                </span>
                            </div>
                            <div className="flex">
                                <span className="font-semibold mr-2">Created At:</span>
                                <span>{new Date(sowDetails.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="flex">
                                <span className="font-semibold mr-2">Updated At:</span>
                                <span>{new Date(sowDetails.updatedAt).toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col gap-4">
                                <span className="font-semibold mr-2">Work Description:</span>
                                <span>
                                    {sowDetails.workDescription ? (
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {sowDetails.workDescription}
                                        </ReactMarkdown>
                                    ) : (
                                        "N/A"
                                    )}
                                </span>
                            </div>
                        </>
                    ) : (
                        <div className="text-gray-500 text-lg">
                            No details available for this SOW.
                        </div>
                    )}
                </div>
                       
               
            </div>
        </div>
    );
}
