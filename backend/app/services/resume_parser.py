import io


class ResumeParserService:
    def extract_raw_text(self, file_content: bytes, filename: str) -> str:
        file_ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

        if file_ext == "pdf":
            return self._extract_pdf_text(file_content)
        elif file_ext == "docx":
            return self._extract_docx_text(file_content)
        else:
            raise ValueError("Unsupported file type. Please upload PDF or DOCX.")

    def _extract_pdf_text(self, file_content: bytes) -> str:
        try:
            import pdfplumber

            text = ""
            with pdfplumber.open(io.BytesIO(file_content)) as pdf:
                for page in pdf.pages:
                    extracted = page.extract_text()
                    if extracted:
                        text += extracted + "\n"

            return text.strip()
        except ImportError:
            raise ValueError("PDF parsing not available")
        except Exception as e:
            raise ValueError(f"Failed to parse PDF: {str(e)}")

    def _extract_docx_text(self, file_content: bytes) -> str:
        try:
            import docx

            doc = docx.Document(io.BytesIO(file_content))
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])

            return text.strip()
        except ImportError:
            raise ValueError("DOCX parsing not available")
        except Exception as e:
            raise ValueError(f"Failed to parse DOCX: {str(e)}")


resume_parser = ResumeParserService()
