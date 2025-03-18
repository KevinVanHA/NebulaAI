"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { Search, Send, Terminal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  createSession,
  queryContract,
  handleUserMessage,
  executeCommand,
} from "../../../scripts/Nebula.mjs";
import { useActiveAccount } from "thirdweb/react";
import {
  sendAndConfirmTransaction,
  prepareTransaction,
  defineChain,
} from "thirdweb";
import { client } from "../client";

export default function BlockchainExplorer() {
  const searchParams = useSearchParams();
  const chainId = searchParams.get("chainId") || "";
  const contractAddress = searchParams.get("searchTerm") || "";

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const account = useActiveAccount();
  const walletAddress = account?.address;

  useEffect(() => {
    const initSession = async () => {
      if (!chainId || !contractAddress) return;

      try {
        const newSessionId = await createSession("Blockchain Explorer Session");
        console.log("Session created:", newSessionId);
        setSessionId(newSessionId);

        setIsTyping(true);
        const contractDetails = await queryContract(
          contractAddress,
          chainId,
          newSessionId
        );
        console.log("Contract details:", contractDetails);
        setMessages([
          { role: "system", content: "Welcome to the Blockchain Explorer." },
          {
            role: "system",
            content: contractDetails || "No details available for this contract.",
          },
        ]);
        setIsTyping(false);
      } catch (error) {
        console.error("Error creating session or querying contract:", error);
        setMessages([
          {
            role: "system",
            content: "Failed to load contract details. Please try again.",
          },
        ]);
        setIsTyping(false);
      }
    };

    initSession();
  }, [chainId, contractAddress]);

  const handleSend = async () => {
    console.log("handleSend triggered", { input, sessionId, chainId, contractAddress });
    if (!input.trim() || !sessionId || !chainId || !contractAddress) {
      console.log("Condition failed, exiting handleSend");
      return;
    }

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");

    try {
      setIsTyping(true);
      const response = await handleUserMessage(
        userMessage,
        sessionId,
        chainId,
        contractAddress
      );
      console.log("handleUserMessage response:", response);
      setMessages((prev) => [...prev, { role: "system", content: response }]);
      setIsTyping(false);
    } catch (error) {
      console.error("Error handling user message:", error);
      setMessages((prev) => [
        ...prev,
        { role: "system", content: "Failed to process your query. Please try again." },
      ]);
      setIsTyping(false);
    }
  };

  const handleExecute = async () => {
    console.log("handleExecute triggered", { account, input, chainId, contractAddress });
    if (!account?.address || !input.includes("execute") || !chainId || !contractAddress) {
      console.log("Condition failed, exiting handleExecute");
      return;
    }

    const executeMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: executeMessage }]);
    setInput("");

    try {
      setIsTyping(true);
      const executeResponse = await executeCommand(
        executeMessage,
        account.address,
        "default-user",
        false,
        chainId,
        contractAddress,
        sessionId
      );
      console.log("executeResponse:", executeResponse);

      const action = executeResponse.actions?.find(
        (a: { type: string; data: string }) => a.type === "sign_transaction"
      );
      console.log("action:", action);

      if (action) {
        const transactionData = JSON.parse(action.data);
        const preparedTransaction = prepareTransaction({
          to: transactionData.to,
          value: transactionData.value || "0x0",
          data: transactionData.data || "",
          chain: defineChain(Number(transactionData.chainId)),
          client,
        });

        const receipt = await sendAndConfirmTransaction({
          transaction: preparedTransaction,
          account,
        });
        console.log("Transaction receipt:", receipt);

        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: `Transaction sent successfully! Hash: ${receipt.transactionHash}`,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "system", content: "No transaction to sign in the response." },
        ]);
      }
      setIsTyping(false);
    } catch (error) {
      console.error("Error executing transaction:", error);
      setMessages((prev) => [
        ...prev,
        { role: "system", content: "Failed to execute the command. Please try again." },
      ]);
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      console.log("Enter key pressed");
      handleSend();
    }
  };

  return (
<div className="flex h-screen bg-eac-bg bg-cover bg-center bg-no-repeat p-6">
        <div className="flex flex-col w-full max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <Search className="w-6 h-6 mr-2" />
          <h1 className="text-xl font-semibold">Blockchain Explorer</h1>
        </div>

        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex mb-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "system" ? (
                <div className="max-w-lg p-4 bg-white rounded-lg shadow-md text-gray-800">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              ) : (
                <div className="max-w-lg p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-md">
                  {message.content}
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start mb-4">
              <div className="p-4 bg-white rounded-lg shadow-md text-gray-500 flex items-center space-x-2">
                <span className="animate-bounce inline-block w-2 h-2 bg-gray-400 rounded-full"></span>
                <span className="animate-bounce inline-block w-2 h-2 bg-gray-400 rounded-full delay-100"></span>
                <span className="animate-bounce inline-block w-2 h-2 bg-gray-400 rounded-full delay-200"></span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-gray-100 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question or execute a command..."
              className="flex-1 p-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            />
            <button
              onClick={() => {
                console.log("Send button clicked");
                handleSend();
              }}
              className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            >
              <Send className="w-5 h-5" />
            </button>
            {input.includes("execute") && (
              <button
                onClick={() => {
                  console.log("Execute button clicked");
                  handleExecute();
                }}
                className="p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200"
              >
                <Terminal className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}