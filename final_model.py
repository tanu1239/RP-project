import tensorflow as tf
from keras.preprocessing.image import ImageDataGenerator, array_to_img, img_to_array, load_img
from keras.preprocessing import image
from keras.models import Model
from keras.applications import imagenet_utils
from keras.layers import Dense,GlobalAveragePooling2D, Conv2D, Dropout
from keras.applications import MobileNet
import numpy as np
import tensorflowjs as tfjs

variables_for_classification=2

mobile = tf.keras.applications.mobilenet.MobileNet()
def prepare_image(file):
    img_path = ''
    img = image.load_img(img_path + file, target_size=(224, 224))
    img_array = image.img_to_array(img)
    img_array_expanded_dims = np.expand_dims(img_array, axis=0)
    return tf.keras.applications.mobilenet.preprocess_input(img_array_expanded_dims)


base_model=MobileNet(weights='imagenet',include_top=False) #imports the mobilenet model and discards the last 1000 neuron layer.
base_model.trainable = False
x=base_model.output
x=GlobalAveragePooling2D()(x)
x=Dense(1024,activation='relu')(x)
x=Dropout(rate=0.2)(x)
preds=Dense(variables_for_classification, activation='softmax')(x) #final layer with softmax activation

model=Model(inputs=base_model.input,outputs=preds)


for layer in model.layers:
    layer.trainable=True

train_datagen=ImageDataGenerator('C:/Users/isusu/PycharmProjects/tf2.1/datar',
width_shift_range=0.25, height_shift_range=0.25,
                            horizontal_flip=True,
                            rotation_range=45,
                            brightness_range=[0.5,1.5],
                            zoom_range=[0.5,1.5],
                                 shear_range = 0.2,
                            rescale=1.0/255.0,
                            samplewise_center=True,
                            samplewise_std_normalization=True,

                            )

train_iterator=train_datagen.flow_from_directory('C:/Users/isusu/PycharmProjects/tf2.1/datar',
                                                     target_size=(224,224),
                                                     color_mode='rgb',
                                                     batch_size=114,
                                                     shuffle=True,
                                                    seed=42
                                                 )


step_size_train=train_iterator.n//train_iterator.batch_size


early = tf.keras.callbacks.EarlyStopping(monitor='loss', mode='min', verbose=1, patience=20)
save_model = tf.keras.callbacks.ModelCheckpoint('final_model.h5', monitor='loss', mode='min', save_best_only=True, verbose=1)

opt = tf.keras.optimizers.Adagrad(learning_rate=0.001)
model.compile(optimizer=opt, loss="binary_crossentropy", metrics=["accuracy"])

model.fit_generator(train_iterator,
                       steps_per_epoch=step_size_train,
                        epochs=500,
                        validation_steps=4,
                        verbose=1,
                    callbacks= [early]
                        )



tfjs.converters.save_keras_model(model, 'C:/Users/isusu/PycharmProjects/tf2.1/final')


