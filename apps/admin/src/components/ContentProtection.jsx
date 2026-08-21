import { useEffect } from "react";

export default function ContentProtection() {
  useEffect(() => {
    // Allow normal right-click.
    // Block right-click only on images.
    const handleContextMenu = (event) => {
      if (event.target?.tagName?.toLowerCase() === "img") {
        event.preventDefault();
      }
    };

    // Disable text selection
    const handleSelectStart = (event) => {
      const target = event.target;
      const tagName = target?.tagName?.toLowerCase();

      // Keep form fields usable
      if (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target?.isContentEditable
      ) {
        return;
      }

      event.preventDefault();
    };

    // Disable image dragging
    const handleDragStart = (event) => {
      if (event.target?.tagName?.toLowerCase() === "img") {
        event.preventDefault();
      }
    };

    // Disable copy
    const handleCopy = (event) => {
      const target = event.target;
      const tagName = target?.tagName?.toLowerCase();

      if (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target?.isContentEditable
      ) {
        return;
      }

      event.preventDefault();
    };

    // Disable cut
    const handleCut = (event) => {
      const target = event.target;
      const tagName = target?.tagName?.toLowerCase();

      if (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target?.isContentEditable
      ) {
        return;
      }

      event.preventDefault();
    };

    // Disable common copy/save shortcuts
    const handleKeyDown = (event) => {
      const target = event.target;
      const tagName = target?.tagName?.toLowerCase();

      // Keep form fields usable
      if (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target?.isContentEditable
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      const ctrlOrCmd = event.ctrlKey || event.metaKey;

      // Copy
      if (ctrlOrCmd && key === "c") {
        event.preventDefault();
      }

      // Cut
      if (ctrlOrCmd && key === "x") {
        event.preventDefault();
      }

      // Save page
      if (ctrlOrCmd && key === "s") {
        event.preventDefault();
      }

      // View source
      if (ctrlOrCmd && key === "u") {
        event.preventDefault();
      }

      // Print
      if (ctrlOrCmd && key === "p") {
        event.preventDefault();
      }

      // Developer tools
      if (event.key === "F12") {
        event.preventDefault();
      }

      if (event.ctrlKey && event.shiftKey && key === "i") {
        event.preventDefault();
      }

      if (event.ctrlKey && event.shiftKey && key === "j") {
        event.preventDefault();
      }

      if (event.ctrlKey && event.shiftKey && key === "c") {
        event.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("selectstart", handleSelectStart);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("cut", handleCut);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("selectstart", handleSelectStart);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("cut", handleCut);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return null;
}