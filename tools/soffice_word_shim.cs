using System;
using System.IO;

public static class SofficeWordShim
{
    public static int Main(string[] args)
    {
        string outputDirectory = null;
        string conversion = null;
        string inputPath = null;

        for (int i = 0; i < args.Length; i++)
        {
            if (args[i] == "--outdir" && i + 1 < args.Length)
            {
                outputDirectory = args[++i];
            }
            else if (args[i] == "--convert-to" && i + 1 < args.Length)
            {
                conversion = args[++i];
            }
            else if (!args[i].StartsWith("-", StringComparison.Ordinal))
            {
                inputPath = args[i];
            }
        }

        if (string.IsNullOrWhiteSpace(inputPath) || string.IsNullOrWhiteSpace(outputDirectory))
        {
            Console.Error.WriteLine("Missing input or output directory.");
            return 2;
        }
        if (!string.Equals(conversion, "pdf", StringComparison.OrdinalIgnoreCase))
        {
            Console.Error.WriteLine("This QA shim supports DOCX to PDF only.");
            return 3;
        }

        Directory.CreateDirectory(outputDirectory);
        string outputPath = Path.Combine(outputDirectory, Path.GetFileNameWithoutExtension(inputPath) + ".pdf");
        Type wordType = Type.GetTypeFromProgID("Word.Application");
        if (wordType == null)
        {
            Console.Error.WriteLine("Microsoft Word COM is unavailable.");
            return 4;
        }

        dynamic word = null;
        dynamic document = null;
        try
        {
            word = Activator.CreateInstance(wordType);
            word.Visible = false;
            word.DisplayAlerts = 0;
            document = word.Documents.Open(Path.GetFullPath(inputPath), ReadOnly: true, AddToRecentFiles: false);
            document.SaveAs2(Path.GetFullPath(outputPath), 17);
            document.Close(false);
            document = null;
            word.Quit(false);
            word = null;
            Console.WriteLine("Converted " + inputPath + " -> " + outputPath);
            return 0;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine(ex.ToString());
            return 5;
        }
        finally
        {
            try { if (document != null) document.Close(false); } catch { }
            try { if (word != null) word.Quit(false); } catch { }
        }
    }
}
