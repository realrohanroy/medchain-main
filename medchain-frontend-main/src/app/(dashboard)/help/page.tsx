'use client';

import {
    Search, FileText, MessageCircle, Phone, ChevronDown, BookOpen, ShieldAlert
} from "lucide-react"
import { useState } from "react";

export default function HelpCenterPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    const faqs = [
        {
            question: "How do I grant doctors access to my medical records?",
            answer: "Navigate to the Access Control page. Under 'My Records', select the documentation you wish to share and click 'Grant Access'. You can then select the provider from our network and define the expiration date for their access."
        },
        {
            question: "Is my medical data entirely secured on the blockchain?",
            answer: "Yes. MedChain utilizes zero-knowledge proofs and decentralized storage networks to ensure that your medical data is encrypted. The blockchain only stores the immutable access logs and cryptographic proofs of your documents, not the actual plaintext data."
        },
        {
            question: "How can I revoke access from a doctor?",
            answer: "In the Access Control page, browse the 'Authorized Doctors' list. Find the corresponding doctor and click the red 'Revoke Access' button. The smart contract will immediately invalidate their decryption keys."
        },
        {
            question: "What should I do if I find an error in my records?",
            answer: "If you notice discrepancies in your clinical notes or lab results, please contact the issuing provider directly using the 'Dispute Record' option within the medical record details view. MedChain cannot retroactively alter verified clinical data."
        }
    ];

    return (
        <div className="min-h-full bg-slate-50/50 pb-20 relative">
            <div className="flex-1 p-8 max-w-[1000px] mx-auto animate-in fade-in duration-500 mt-2 space-y-10">

                {/* Header & Search */}
                <div className="bg-blue-600 rounded-[2.5rem] p-12 text-center relative overflow-hidden shadow-lg shadow-blue-600/20">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                        <h2 className="text-[2.5rem] font-bold tracking-tight text-white leading-tight">
                            How can we help you today?
                        </h2>
                        <p className="text-[16px] text-blue-100 font-medium pb-4">
                            Search our knowledge base or get in touch with our support team.
                        </p>

                        <div className="relative flex items-center max-w-xl mx-auto">
                            <Search className="absolute left-5 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search articles, guides, and FAQs..."
                                className="w-full py-4 pl-14 pr-6 rounded-full text-[15px] font-bold text-slate-900 shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-400/50 transition-all border-none"
                            />
                            <button className="absolute right-2 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-full text-[13px] hover:bg-blue-700 active:scale-95 transition-all shadow-sm">
                                Search
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Support Cards */}
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group cursor-pointer text-center">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <BookOpen className="w-7 h-7" />
                        </div>
                        <h3 className="text-[17px] font-bold text-slate-900 mb-2">User Guides</h3>
                        <p className="text-[13px] font-medium text-slate-500">Step-by-step tutorials on using the MedChain patient portal.</p>
                    </div>

                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group cursor-pointer text-center">
                        <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-orange-600 group-hover:text-white transition-all">
                            <ShieldAlert className="w-7 h-7" />
                        </div>
                        <h3 className="text-[17px] font-bold text-slate-900 mb-2">Security & Privacy</h3>
                        <p className="text-[13px] font-medium text-slate-500">Learn how your data is encrypted and managed via blockchain.</p>
                    </div>

                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group cursor-pointer text-center">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                            <Phone className="w-7 h-7" />
                        </div>
                        <h3 className="text-[17px] font-bold text-slate-900 mb-2">Contact Support</h3>
                        <p className="text-[13px] font-medium text-slate-500">Get in touch with our 24/7 dedicated customer service team.</p>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="bg-white rounded-[2rem] p-10 border border-slate-100 shadow-sm">
                    <h3 className="text-[1.5rem] font-bold text-slate-900 mb-8">Frequently Asked Questions</h3>

                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className={`border rounded-[1.25rem] transition-all overflow-hidden ${openFaq === index ? 'border-blue-200 bg-blue-50/20' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                            >
                                <button
                                    className="w-full px-7 py-6 flex items-center justify-between text-left"
                                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                >
                                    <span className="text-[15px] font-bold text-slate-900 pr-8">{faq.question}</span>
                                    <ChevronDown className={`w-5 h-5 shrink-0 transition-transform duration-300 ${openFaq === index ? 'text-blue-600 rotate-180' : 'text-slate-400'}`} />
                                </button>

                                {openFaq === index && (
                                    <div className="px-7 pb-7 text-[14px] text-slate-600 font-medium leading-relaxed">
                                        <div className="w-full h-px bg-slate-200 mb-5"></div>
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}
