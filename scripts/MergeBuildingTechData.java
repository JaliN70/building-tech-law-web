import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.regex.*;

public class MergeBuildingTechData {
    static class LawBundle {
        String id, lawObj, attachments, categories;
    }

    static LawBundle parseDataJs(Path path, String id) throws IOException {
        String text = Files.readString(path, StandardCharsets.UTF_8);
        LawBundle b = new LawBundle();
        b.id = id;
        b.lawObj = extractBlock(text, "const LAW = ", "};");
        b.attachments = extractOptionalBlock(text, "const ATTACHMENTS = ", "];");
        b.categories = extractBlock(text, "const CATEGORIES = ", "];");
        return b;
    }

    static String extractBlock(String text, String start, String endMarker) {
        int i = text.indexOf(start);
        if (i < 0) throw new RuntimeException("Missing " + start);
        i += start.length();
        int end = text.indexOf(endMarker, i);
        if (end < 0) throw new RuntimeException("Missing end for " + start);
        end += endMarker.length();
        return text.substring(i, end).trim();
    }

    static String extractOptionalBlock(String text, String start, String endMarker) {
        int i = text.indexOf(start);
        if (i < 0) return null;
        i += start.length();
        int end = text.indexOf(endMarker, i);
        if (end < 0) return null;
        end += endMarker.length();
        return text.substring(i, end).trim();
    }

    static String emit(Path out) throws IOException {
        Path base = Path.of("C:\\Users\\jalin.you\\AJ-WORK");
        LawBundle design = parseDataJs(base.resolve("building-design-law-web/js/data.js"), "design");
        LawBundle structure = parseDataJs(base.resolve("building-structure-law-web/js/data.js"), "structure");
        LawBundle equipment = parseDataJs(base.resolve("building-equipment-law-web/js/data.js"), "equipment");

        StringBuilder sb = new StringBuilder();
        sb.append("/**\n * 建築技術規則（設計施工編 · 構造編 · 設備編）— 導覽資料\n */\n");
        sb.append("const APP = {\n");
        sb.append("  name: \"建築技術規則\",\n");
        sb.append("  shortName: \"建築技術規則\",\n");
        sb.append("  updated: \"2026/09/03\",\n");
        sb.append("  author: \"AJ\",\n");
        sb.append("};\n\n");
        sb.append("function mojArticleUrl(pcode, article) {\n");
        sb.append("  const flno = String(article).replace(/\\s+/g, '');\n");
        sb.append("  return `https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=${pcode}&flno=${encodeURIComponent(flno)}`;\n");
        sb.append("}\n\n");
        sb.append("const LAWS = [\n");

        for (LawBundle b : List.of(design, structure, equipment)) {
            sb.append("  {\n");
            sb.append("    id: \"").append(b.id).append("\",\n");
            // parse pcode from law obj for convenience
            Matcher pm = Pattern.compile("pcode:\\s*'([^']+)'").matcher(b.lawObj);
            String pcode = pm.find() ? pm.group(1) : "";
            sb.append("    ").append(b.lawObj.replaceFirst("^\\{", "").replaceFirst("\\}$", "").trim());
            if (!b.lawObj.contains("pcode:")) sb.append("    pcode: '").append(pcode).append("',\n");
            // law fields already in lawObj - need to embed law object fields directly
        }

        // Fix approach - embed law object as spread
        sb.setLength(0);
        sb.append("/**\n * 建築技術規則（設計施工編 · 構造編 · 設備編）— 導覽資料\n */\n");
        sb.append("const APP = {\n");
        sb.append("  name: \"建築技術規則\",\n");
        sb.append("  shortName: \"建築技術規則\",\n");
        sb.append("  updated: \"2026/09/03\",\n");
        sb.append("  author: \"AJ\",\n");
        sb.append("};\n\n");
        sb.append("function mojArticleUrl(pcode, article) {\n");
        sb.append("  const flno = String(article).replace(/\\s+/g, '');\n");
        sb.append("  return `https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=${pcode}&flno=${encodeURIComponent(flno)}`;\n");
        sb.append("}\n\n");
        sb.append("const LAWS = [\n");

        String[][] meta = {
            {"design", "📐", "建築設計施工編"},
            {"structure", "🏗️", "建築構造編"},
            {"equipment", "⚡", "建築設備編"}
        };
        LawBundle[] bundles = {design, structure, equipment};

        for (int idx = 0; idx < bundles.length; idx++) {
            LawBundle b = bundles[idx];
            sb.append("  {\n");
            sb.append("    id: \"").append(b.id).append("\",\n");
            sb.append("    bookIcon: \"").append(meta[idx][1]).append("\",\n");
            String lawInner = b.lawObj.trim();
            if (lawInner.startsWith("{")) lawInner = lawInner.substring(1);
            if (lawInner.endsWith("};")) lawInner = lawInner.substring(0, lawInner.length() - 2);
            else if (lawInner.endsWith("}")) lawInner = lawInner.substring(0, lawInner.length() - 1);
            lawInner = lawInner.trim();
            for (String line : lawInner.split("\n")) {
                sb.append("    ").append(line.trim()).append("\n");
            }
            if (b.attachments != null) {
                String att = b.attachments.trim();
                if (att.endsWith("];")) att = att.substring(0, att.length() - 1);
                sb.append("    attachments: ").append(att).append(",\n");
            }
            String cats = b.categories.trim();
            if (cats.endsWith("];")) cats = cats.substring(0, cats.length() - 1);
            sb.append("    categories: ").append(cats).append("\n");
            sb.append("  },\n");
        }
        sb.append("];\n");
        Files.writeString(out, sb.toString(), StandardCharsets.UTF_8);
        return sb.toString();
    }

    public static void main(String[] args) throws Exception {
        Path out = Path.of("C:\\Users\\jalin.you\\AJ-WORK\\building-tech-law-web\\js\\data.js");
        Files.createDirectories(out.getParent());
        emit(out);
        String s = Files.readString(out);
        long cats = s.chars().filter(ch -> ch == '{').count();
        System.out.println("Written " + out + " (" + s.length() + " chars, ~" + cats + " blocks)");
    }
}
