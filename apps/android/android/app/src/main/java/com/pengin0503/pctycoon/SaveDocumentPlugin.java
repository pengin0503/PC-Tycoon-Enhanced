package com.pengin0503.pctycoon;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
@CapacitorPlugin(name = "SaveDocument")
public class SaveDocumentPlugin extends Plugin {
    @PluginMethod
    public void write(PluginCall call) {
        String json = call.getString("json");
        String filename = call.getString("filename");
        if (json == null || json.getBytes(StandardCharsets.UTF_8).length > 5 * 1024 * 1024 ||
            filename == null || !filename.matches("pc-tycoon-[a-zA-Z0-9_-]{1,80}\\.json")) {
            call.reject("書き出し形式または容量が不正です");
            return;
        }
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        intent.putExtra(Intent.EXTRA_TITLE, filename);
        startActivityForResult(call, intent, "documentSelected");
    }
    @ActivityCallback
    private void documentSelected(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Uri uri = result.getData() == null ? null : result.getData().getData();
        if (result.getResultCode() != Activity.RESULT_OK || uri == null) {
            call.reject("JSON書き出しをキャンセルしました");
            return;
        }
        bridge.execute(() -> {
            try (OutputStream stream = getContext().getContentResolver().openOutputStream(uri, "wt")) {
                if (stream == null) throw new IllegalStateException("保存先を開けません");
                stream.write(call.getString("json").getBytes(StandardCharsets.UTF_8));
                stream.flush();
                call.resolve();
            } catch (Exception error) {
                call.reject("JSON書き出しに失敗しました。保存先・空き容量を確認してください。", error);
            }
        });
    }
}
